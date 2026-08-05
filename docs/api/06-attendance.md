# Attendance

## Overview

Attendance endpoints support active session state, QR-based check-in, check-out, attendance history, and attendance analytics.

## Active Attendance

### GET /api/attendance/active

Response:
- `200 OK`
- For `STUDENT`:
  - `{ ... }` from student active attendance service
- For `WORKER`:
  - `{ hasActiveSession, hasAttendanceToday, activeSession, todaySessions, todayTotalHours, canCheckIn, canCheckOut }`

Authorization:
- `STUDENT` or `WORKER`

Errors:
- `401 Unauthorized`
- `404 Not Found` if the user profile is missing
- `500 Internal Server Error`

## Check-In

### POST /api/attendance/check-in

Request body:
- one of `qrCodeData`, `qrData`, `scannedData`, `code`
- `latitude` number
- `longitude` number
- `accuracy` number optional

Behavior:
- Normalizes QR code data and looks up an active office location.
- Requires an active office location QR code.
- Requires a `STUDENT` or `WORKER` session.
- Rejects if the user already has an active attendance session.
- Verifies location using `GeolocationService`.

Response:
- `200 OK`
- `{ success: true, message, attendance: { ... } }`

Errors:
- `400 Bad Request` if QR code is missing or invalid, if an active session already exists, or if location verification fails
- `403 Forbidden` if the user profile is not provisioned
- `401 Unauthorized`
- `500 Internal Server Error`

## Check-Out

### POST /api/attendance/check-out

Request body:
- `attendanceId` string
- `latitude` number
- `longitude` number
- `accuracy` number optional

Behavior:
- Finds the active attendance session for the current user.
- Calculates hours worked based on check-in and check-out timestamps.
- Updates the attendance record with `COMPLETED` status.

Response:
- `200 OK`
- `{ success: true, message, attendance: { ... }, locationMessage }`

Errors:
- `404 Not Found` if no active attendance session exists
- `400 Bad Request` for invalid request data
- `401 Unauthorized`
- `500 Internal Server Error`

## Attendance History

### GET /api/attendance/history

Query parameters:
- `page` integer optional
- `limit` integer optional
- `startDate` string optional
- `endDate` string optional

Response:
- `200 OK`
- `{ records: [...], pagination: { page, limit, total, pages }, stats: { totalHours, completedDays, totalRecords } }`

Authorization:
- `STUDENT` or `WORKER`

Errors:
- `401 Unauthorized`
- `400 Bad Request` for invalid query params
- `500 Internal Server Error`

## Attendance Analytics

### GET /api/attendance/analytics

Query parameters:
- `startDate` string optional
- `endDate` string optional
- `departmentId` string optional

Behavior:
- `ADMIN` or `STUDENT` only.
- Students see analytics scoped to their own attendance.

Response:
- `200 OK`
- `{ overview: { totalRecords, activeSessions, completedSessions, totalHours, averageHours, completionRate }, topStudents: [...], dailyStats: [...], studentStats?: { ... } }`

Errors:
- `401 Unauthorized`
- `400 Bad Request` for invalid params
- `500 Internal Server Error`
