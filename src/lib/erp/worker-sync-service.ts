import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { ErpClient } from "@/lib/erp/erp-client";
import type { SyncLogger } from "@/lib/erp/sync-logger";
import type { WorkerMapper } from "@/lib/erp/worker-mapper";
import type { ErpEmployeeRecord, WorkerSyncResult } from "@/lib/erp/types";
import { UserRole } from "@/types";

export interface WorkerSyncService {
  syncWorkers(): Promise<WorkerSyncResult>;
}

export class BgWorkerSyncService implements WorkerSyncService {
  constructor(
    private readonly client: ErpClient,
    private readonly mapper: WorkerMapper,
    private readonly logger: SyncLogger,
  ) {}

  async syncWorkers(): Promise<WorkerSyncResult> {
    const startedAt = new Date();
    const result: WorkerSyncResult = {
      success: true,
      createdCount: 0,
      updatedCount: 0,
      inactiveCount: 0,
      skippedCount: 0,
      errors: [],
      startedAt: startedAt.toISOString(),
    };

    this.logger.info("Starting ERP worker synchronization", {
      startedAt: startedAt.toISOString(),
    });

    try {
      const resp = await this.client.fetchEmployees();
      // resp: { data, pagination, pagesFetched }
      const respObj = resp as unknown as Record<string, unknown>;
      const employeesRaw = Array.isArray(respObj["data"])
        ? (respObj["data"] as unknown[])
        : [];
      const pagesFetched = Number(respObj["pagesFetched"] ?? 1);

      this.logger.info("ERP pages downloaded", { pages: pagesFetched });

      const employees = employeesRaw.filter(
        (e: unknown): e is ErpEmployeeRecord =>
          Boolean(e && typeof e === "object"),
      );

      this.logger.info("ERP workers received", { count: employees.length });

      // Perform all DB writes inside a single transaction so we can abort on failure
      let created = 0;
      let updated = 0;
      let inactive = 0;
      let skipped = 0;

      await prisma.$transaction(async (tx) => {
        for (const employee of employees) {
          // map fields
          const mappedFields = this.mapper.mapEmployeeToWorkerProfile(employee);
          // identifier priority: ERP id (documented `id`) then staffno
          const erpEmployeeId = (mappedFields.erpEmployeeId || "")
            .toString()
            .trim();
          const staffNumber = (mappedFields.staffNumber || "")
            .toString()
            .trim();

          if (!erpEmployeeId && !staffNumber) {
            skipped += 1;
            this.logger.warn("Skipping employee without ERP identifiers", {
              employee,
            });
            continue;
          }

          const isActive = this.isEmployeeActive(employee, mappedFields);

          // find existing worker by erp id first, then staff number
          type WorkerProfileWithUser = Awaited<
            ReturnType<typeof tx.workerProfile.findFirst>
          > & { user: { name: string | null; email: string | null } };

          let existingWorker: WorkerProfileWithUser | null = null;
          if (erpEmployeeId) {
            existingWorker = await tx.workerProfile.findFirst({
              where: { erpEmployeeId },
              include: { user: true },
            });
          }
          if (!existingWorker && staffNumber) {
            existingWorker = await tx.workerProfile.findFirst({
              where: { staffNumber },
              include: { user: true },
            });
          }

          if (!isActive) {
            if (existingWorker) {
              await tx.user.update({
                where: { id: existingWorker.userId },
                data: { isActive: false },
              });
              await tx.workerProfile.update({
                where: { id: existingWorker.id },
                data: {
                  employmentStatus: "INACTIVE",
                  lastSyncTime: new Date(),
                },
              });
              inactive += 1;
              this.logger.info("Marked worker inactive from ERP", {
                workerId: existingWorker.id,
                erpEmployeeId,
                staffNumber,
              });
            } else {
              // No local record to mark inactive — count as skipped for reporting
              skipped += 1;
              this.logger.warn(
                "ERP employee inactive and no local worker found",
                { erpEmployeeId, staffNumber },
              );
            }
            continue;
          }

          if (existingWorker) {
            // update user and profile
            const displayName =
              mappedFields.fullName ||
              [
                mappedFields.firstName,
                mappedFields.middleName,
                mappedFields.lastName,
              ]
                .filter(Boolean)
                .join(" ") ||
              employee.name ||
              existingWorker.user?.name ||
              "ERP Worker";
            const email =
              (mappedFields.email && mappedFields.email.trim()) ||
              existingWorker.user?.email ||
              this.buildFallbackEmail(employee);

            await tx.user.update({
              where: { id: existingWorker.userId },
              data: {
                name: displayName,
                email,
                role: UserRole.WORKER,
                isActive: true,
              },
            });

            await tx.workerProfile.update({
              where: { id: existingWorker.id },
              data: {
                erpEmployeeId: mappedFields.erpEmployeeId ?? null,
                staffNumber: mappedFields.staffNumber ?? null,
                firstName: mappedFields.firstName ?? null,
                middleName: mappedFields.middleName ?? null,
                lastName: mappedFields.lastName ?? null,
                fullName: mappedFields.fullName ?? null,
                email: mappedFields.email ?? null,
                phoneNumber: mappedFields.phoneNumber ?? null,
                department: mappedFields.department ?? null,
                jobTitle: mappedFields.jobTitle ?? null,
                employmentStatus: mappedFields.employmentStatus ?? null,
                nationalId: mappedFields.nationalId ?? null,
                dateEmployed: mappedFields.dateEmployed ?? null,
                gender: mappedFields.gender ?? null,
                lastSyncTime: new Date(),
                erpUpdatedAt: mappedFields.erpUpdatedAt ?? null,
              },
            });

            updated += 1;
          } else {
            // create user + profile
            const defaultPassword =
              process.env.DEFAULT_USER_PASSWORD || "ChangeMe123";
            const hashedPassword = await bcrypt.hash(defaultPassword, 12);
            const displayName =
              mappedFields.fullName ||
              [
                mappedFields.firstName,
                mappedFields.middleName,
                mappedFields.lastName,
              ]
                .filter(Boolean)
                .join(" ") ||
              employee.name ||
              "ERP Worker";
            const fallbackEmail = this.buildFallbackEmail(employee);
            const email = (mappedFields.email || fallbackEmail).trim();

            const user = await tx.user.create({
              data: {
                name: displayName,
                email,
                password: hashedPassword,
                role: UserRole.WORKER,
                isActive: true,
                mustChangePassword: true,
              },
            });

            await tx.workerProfile.create({
              data: {
                userId: user.id,
                erpEmployeeId: mappedFields.erpEmployeeId ?? null,
                staffNumber: mappedFields.staffNumber ?? null,
                firstName: mappedFields.firstName ?? null,
                middleName: mappedFields.middleName ?? null,
                lastName: mappedFields.lastName ?? null,
                fullName: mappedFields.fullName ?? null,
                email: mappedFields.email ?? null,
                phoneNumber: mappedFields.phoneNumber ?? null,
                department: mappedFields.department ?? null,
                jobTitle: mappedFields.jobTitle ?? null,
                employmentStatus: mappedFields.employmentStatus ?? null,
                nationalId: mappedFields.nationalId ?? null,
                dateEmployed: mappedFields.dateEmployed ?? null,
                gender: mappedFields.gender ?? null,
                lastSyncTime: new Date(),
                erpUpdatedAt: mappedFields.erpUpdatedAt ?? null,
              },
            });

            created += 1;
          }
        }
      });

      result.createdCount = created;
      result.updatedCount = updated;
      result.inactiveCount = inactive;
      result.skippedCount = skipped;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown ERP sync failure";
      result.success = false;
      result.errors.push(message);
      this.logger.error("ERP worker synchronization failed", {
        error: message,
      });
    }

    const finishedAt = new Date();
    result.finishedAt = finishedAt.toISOString();
    result.durationMs = finishedAt.getTime() - startedAt.getTime();
    result.duration = `${(result.durationMs / 1000).toFixed(2)}s`;
    result.lastSyncAt = finishedAt.toISOString();

    this.logger.info("ERP worker synchronization completed", {
      createdCount: result.createdCount,
      updatedCount: result.updatedCount,
      inactiveCount: result.inactiveCount,
      skippedCount: result.skippedCount,
      errors: result.errors,
      duration: result.duration,
      lastSyncAt: result.lastSyncAt,
    });
    return result;
  }

  private async findExistingWorker(search: {
    erpEmployeeId?: string | null;
    staffNumber?: string | null;
  }) {
    if (search.erpEmployeeId) {
      const worker = await prisma.workerProfile.findFirst({
        where: { erpEmployeeId: search.erpEmployeeId },
        include: { user: true },
      });
      if (worker) {
        return worker;
      }
    }

    if (search.staffNumber) {
      return prisma.workerProfile.findFirst({
        where: { staffNumber: search.staffNumber },
        include: { user: true },
      });
    }

    return null;
  }

  private async createWorker(
    mappedFields: ReturnType<WorkerMapper["mapEmployeeToWorkerProfile"]>,
    employee: ErpEmployeeRecord,
  ) {
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || "ChangeMe123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);
    const displayName =
      mappedFields.fullName ||
      [mappedFields.firstName, mappedFields.middleName, mappedFields.lastName]
        .filter(Boolean)
        .join(" ") ||
      employee.name ||
      "ERP Worker";
    const fallbackEmail = this.buildFallbackEmail(employee);
    const email = (mappedFields.email || fallbackEmail).trim();

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: displayName,
          email,
          password: hashedPassword,
          role: UserRole.WORKER,
          isActive: true,
          mustChangePassword: true,
        },
      });

      await tx.workerProfile.create({
        data: {
          userId: user.id,
          erpEmployeeId: mappedFields.erpEmployeeId ?? null,
          staffNumber: mappedFields.staffNumber ?? null,
          firstName: mappedFields.firstName ?? null,
          middleName: mappedFields.middleName ?? null,
          lastName: mappedFields.lastName ?? null,
          fullName: mappedFields.fullName ?? null,
          email: mappedFields.email ?? null,
          phoneNumber: mappedFields.phoneNumber ?? null,
          department: mappedFields.department ?? null,
          jobTitle: mappedFields.jobTitle ?? null,
          employmentStatus: mappedFields.employmentStatus ?? null,
          nationalId: mappedFields.nationalId ?? null,
          dateEmployed: mappedFields.dateEmployed ?? null,
          gender: mappedFields.gender ?? null,
          lastSyncTime: new Date(),
          erpUpdatedAt: mappedFields.erpUpdatedAt ?? null,
        },
      });
    });
  }

  private async updateWorker(
    existingWorker: Awaited<
      ReturnType<typeof prisma.workerProfile.findFirst>
    > & {
      user: Awaited<ReturnType<typeof prisma.user.findUnique>>;
    },
    mappedFields: ReturnType<WorkerMapper["mapEmployeeToWorkerProfile"]>,
    employee: ErpEmployeeRecord,
  ) {
    const displayName =
      mappedFields.fullName ||
      [mappedFields.firstName, mappedFields.middleName, mappedFields.lastName]
        .filter(Boolean)
        .join(" ") ||
      employee.name ||
      existingWorker.user?.name ||
      "ERP Worker";
    const email =
      mappedFields.email?.trim() ||
      existingWorker.user?.email ||
      this.buildFallbackEmail(employee);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: existingWorker.userId },
        data: {
          name: displayName,
          email,
          role: UserRole.WORKER,
          isActive: true,
          mustChangePassword: existingWorker.user?.mustChangePassword ?? true,
        },
      });

      await tx.workerProfile.update({
        where: { id: existingWorker.id },
        data: {
          erpEmployeeId: mappedFields.erpEmployeeId ?? null,
          staffNumber: mappedFields.staffNumber ?? null,
          firstName: mappedFields.firstName ?? null,
          middleName: mappedFields.middleName ?? null,
          lastName: mappedFields.lastName ?? null,
          fullName: mappedFields.fullName ?? null,
          email: mappedFields.email ?? null,
          phoneNumber: mappedFields.phoneNumber ?? null,
          department: mappedFields.department ?? null,
          jobTitle: mappedFields.jobTitle ?? null,
          employmentStatus: mappedFields.employmentStatus ?? null,
          nationalId: mappedFields.nationalId ?? null,
          dateEmployed: mappedFields.dateEmployed ?? null,
          gender: mappedFields.gender ?? null,
          lastSyncTime: new Date(),
          erpUpdatedAt: mappedFields.erpUpdatedAt ?? null,
        },
      });
    });
  }

  private async markWorkerInactive(workerProfileId: string, userId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { isActive: false },
      });

      await tx.workerProfile.update({
        where: { id: workerProfileId },
        data: {
          employmentStatus: "INACTIVE",
          lastSyncTime: new Date(),
        },
      });
    });
  }

  private buildFallbackEmail(employee: ErpEmployeeRecord) {
    const base =
      employee.staffNumber || employee.employeeId || employee.id || "worker";
    return `${
      String(base)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") || "worker"
    }@erp.local`;
  }

  private isEmployeeActive(
    employee: ErpEmployeeRecord,
    mappedFields: ReturnType<WorkerMapper["mapEmployeeToWorkerProfile"]>,
  ) {
    if (typeof employee.isActive === "boolean") {
      return employee.isActive;
    }

    if (typeof mappedFields.employmentStatus === "string") {
      return !["INACTIVE", "DISABLED", "TERMINATED"].includes(
        mappedFields.employmentStatus.toUpperCase(),
      );
    }

    return true;
  }
}
