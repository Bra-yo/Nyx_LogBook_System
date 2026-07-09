export interface ErpEmployeeRecord {
  // BG documented field names
  id?: string | null; // ERP id (documented)
  staffno?: string | null; // staff number (documented)
  fname?: string | null; // first name
  mname?: string | null; // middle name
  Iname?: string | null; // last name (documented as Iname)
  gender?: string | null;
  dob?: string | Date | null;
  marital?: string | null;
  national_id?: string | null;
  email?: string | null;
  salary_status?: string | null;
  // Common legacy/alternate keys (fallbacks)
  staffNumber?: string | null;
  employeeId?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  department?: string | null;
  jobTitle?: string | null;
  employmentStatus?: string | null;
  nationalId?: string | null;
  dateEmployed?: string | Date | null;
  isActive?: boolean | null;
  updatedAt?: string | Date | null;
  [key: string]: unknown;
}

export interface WorkerSyncResult {
  success: boolean;
  createdCount: number;
  updatedCount: number;
  inactiveCount: number;
  skippedCount: number;
  errors: string[];
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  duration?: string;
  lastSyncAt?: string;
}
