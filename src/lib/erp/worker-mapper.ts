import type { ErpEmployeeRecord } from "@/lib/erp/types";

/**
 * Type normalization helpers to ensure all ERP values are converted to correct Prisma types.
 * These helpers make the sync resilient to primitive type differences from the ERP API.
 */

/**
 * Convert any value to string or null.
 * Trims whitespace and converts numbers, booleans, and other primitives.
 */
const toStringOrNull = (value: unknown): string | null => {
  if (value == null) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
};

/**
 * Convert any value to Date or null.
 * Handles string dates, number timestamps, and Date objects.
 * Returns null if conversion fails or value is invalid.
 */
const toDateOrNull = (value: unknown): Date | null => {
  if (value == null) return null;
  if (value instanceof Date) return value;

  try {
    const dateStr = String(value).trim();
    if (!dateStr) return null;
    const date = new Date(dateStr);
    // Check if the date is valid (not NaN)
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

/**
 * Convert any value to number or null.
 * Useful for numeric fields if ERP returns strings.
 */
const toNumberOrNull = (value: unknown): number | null => {
  if (value == null) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

export interface WorkerMapper {
  mapEmployeeToWorkerProfile(employee: ErpEmployeeRecord): {
    erpEmployeeId: string | null;
    staffNumber: string | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    fullName: string | null;
    email: string | null;
    phoneNumber: string | null;
    department: string | null;
    jobTitle: string | null;
    employmentStatus: string | null;
    nationalId: string | null;
    dateEmployed: Date | null;
    gender: string | null;
    erpUpdatedAt: Date | null;
  };
}

export class BgWorkerMapper implements WorkerMapper {
  mapEmployeeToWorkerProfile(
    employee: ErpEmployeeRecord,
  ): ReturnType<WorkerMapper["mapEmployeeToWorkerProfile"]> {
    // Determine employment status (from documented salary_status or fallback)
    const employmentStatus = toStringOrNull(
      employee.salary_status ?? employee.employmentStatus,
    );

    // Build full name from documented fields first
    const firstName = toStringOrNull(employee.fname ?? employee.firstName);
    const middleName = toStringOrNull(employee.mname ?? employee.middleName);
    const lastName = toStringOrNull(employee.Iname ?? employee.lastName);

    const builtFullName = [firstName, middleName, lastName]
      .filter(Boolean)
      .join(" ");
    const fullName = toStringOrNull(
      employee.fullName ?? employee.name ?? builtFullName,
    );

    // Determine dateEmployed: try documented dateEmployed field first, then dob
    const dateEmployed =
      toDateOrNull(employee.dateEmployed) ?? toDateOrNull(employee.dob);

    return {
      // Identifier priority: documented `id` then documented `staffno`
      // Convert to string to handle integer IDs from ERP API
      erpEmployeeId:
        toStringOrNull(employee.id) ?? toStringOrNull(employee.employeeId),
      staffNumber:
        toStringOrNull(employee.staffno) ??
        toStringOrNull(employee.staffNumber),
      firstName,
      middleName,
      lastName,
      fullName,
      email: toStringOrNull(employee.email),
      phoneNumber: toStringOrNull(employee.phoneNumber),
      department: toStringOrNull(employee.department),
      jobTitle: toStringOrNull(employee.jobTitle),
      employmentStatus,
      nationalId: toStringOrNull(employee.national_id ?? employee.nationalId),
      dateEmployed,
      gender: toStringOrNull(employee.gender),
      erpUpdatedAt: toDateOrNull(employee.updatedAt),
    };
  }
}
