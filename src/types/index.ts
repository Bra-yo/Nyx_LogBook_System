export enum UserRole {
  STUDENT = "STUDENT",
  SUPERVISOR = "SUPERVISOR",
  LECTURER = "LECTURER",
  ADMIN = "ADMIN",
  WORKER = "WORKER",
}

export enum LogStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  DRAFT = "DRAFT",
}

export enum AssessmentStatus {
  NOT_ASSESSED = "NOT_ASSESSED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum AttendanceStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  officeLocationId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLat: number;
  checkInLng: number;
  checkOutLat?: number;
  checkOutLng?: number;
  status: AttendanceStatus;
  hoursWorked?: number;
  qrCodeData: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  officeLocation: OfficeLocation;
  student: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  qrCodeData: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface AttendanceStats {
  totalHours: number;
  averageHours: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  overtimeHours: number;
}

export interface AttendanceAnalytics {
  dailyStats: Array<{
    date: string;
    checkInTime: string;
    checkOutTime: string;
    hoursWorked: number;
    status: AttendanceStatus;
  }>;
  weeklyStats: Array<{
    week: string;
    totalHours: number;
    daysPresent: number;
    averageHours: number;
  }>;
  monthlyStats: Array<{
    month: string;
    totalHours: number;
    daysPresent: number;
    averageHours: number;
  }>;
}
