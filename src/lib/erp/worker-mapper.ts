import type { ErpEmployeeRecord } from "@/lib/erp/types";

export interface WorkerMapper {
  mapEmployeeToWorkerProfile(employee: ErpEmployeeRecord): {
    erpEmployeeId?: string | null;
    staffNumber?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    department?: string | null;
    jobTitle?: string | null;
    employmentStatus?: string | null;
    nationalId?: string | null;
    dateEmployed?: Date | null;
    gender?: string | null;
    erpUpdatedAt?: Date | null;
  };
}

export class BgWorkerMapper implements WorkerMapper {
  mapEmployeeToWorkerProfile(employee: ErpEmployeeRecord) {
    const erpUpdatedAt = employee.updatedAt
      ? new Date(String(employee.updatedAt))
      : undefined;

    // Build full name from documented fields first
    const fullName =
      (employee.fullName ??
        employee.name ??
        [
          employee.fname ?? employee.firstName,
          employee.mname ?? employee.middleName,
          employee.Iname ?? employee.lastName,
        ]
          .filter(Boolean)
          .join(" ")) ||
      null;

    return {
      // Identifier priority: documented `id` then documented `staffno` (mapped in sync service)
      erpEmployeeId: employee.id ?? employee.employeeId ?? null,
      staffNumber: employee.staffno ?? employee.staffNumber ?? null,
      firstName: employee.fname ?? employee.firstName ?? null,
      middleName: employee.mname ?? employee.middleName ?? null,
      lastName: employee.Iname ?? employee.lastName ?? null,
      fullName,
      email: employee.email ?? null,
      phoneNumber: employee.phoneNumber ?? null,
      department: employee.department ?? null,
      jobTitle: employee.jobTitle ?? null,
      employmentStatus:
        employee.salary_status ?? employee.employmentStatus ?? null,
      nationalId: employee.national_id ?? employee.nationalId ?? null,
      // Keep both dob and dateEmployed if provided; convert to Date where applicable
      dateEmployed: employee.dateEmployed
        ? new Date(String(employee.dateEmployed))
        : employee.dob
          ? new Date(String(employee.dob))
          : null,
      gender: employee.gender ?? null,
      erpUpdatedAt,
      // include raw documented fields that don't map directly so higher layers can inspect if needed
      dob: employee.dob ?? null,
      marital: employee.marital ?? null,
      salary_status: employee.salary_status ?? null,
    };
  }
}
