# Worklogs

## Overview

Worklog endpoints cover worker logbooks, student logbooks, and supervisor review retrieval.

## Worker Logbook

### GET /api/worker/logbook

Query parameters:
- `page` integer optional
- `limit` integer optional
- `status` string optional
- `startDate` string optional
- `endDate` string optional

Response:
- `200 OK`
- `{ entries: [...], pagination: { page, limit, total, pages } }`

Authorization:
- `WORKER` only

Errors:
- `401 Unauthorized`
- `400 Bad Request` for invalid query params
- `500 Internal Server Error`

### POST /api/worker/logbook

Request body:
- `taskId` string
- `workDate` string (ISO)
- `startTime` string optional (ISO)
- `endTime` string optional (ISO)
- `hoursWorked` number optional
- `progressDescription` string
- `achievements` string optional
- `challenges` string optional
- `completionPercentage` integer optional
- `status` `DRAFT` | `PENDING` optional

Behavior:
- Requires the worker to have checked in today.
- Rejects duplicate entries for the same task and date.
- Validates `endTime > startTime` when both are provided.
- Validates `hoursWorked` is non-negative.

Response:
- `200 OK`
- `{ success: true, message: "Work log entry created successfully", entry: { ... } }`

Errors:
- `400 Bad Request` for invalid data or invalid times
- `403 Forbidden` if the worker has not checked in today
- `409 Conflict` for duplicate task/date entries
- `401 Unauthorized`
- `500 Internal Server Error`

### GET /api/worker/logbook/[id]

Response:
- `200 OK`
- `{ success: true, entry: { ... } }`

Errors:
- `404 Not Found` if entry does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/worker/logbook/[id]

Request body:
- any of the same fields as POST, optional

Behavior:
- Only draft entries may be edited.
- Rejects updates to entries with status `APPROVED` or `PENDING`.
- Validates date, time, and non-negative hours.
- Prevents duplicate task/date entries when `workDate` changes.

Response:
- `200 OK`
- `{ success: true, message: "Work log entry updated successfully", entry: { ... } }`

Errors:
- `400 Bad Request` for invalid data or business rules
- `404 Not Found` if entry does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/worker/logbook/[id]

Behavior:
- Only draft entries may be deleted.

Response:
- `200 OK`
- `{ success: true, message: "Work log entry deleted successfully" }`

Errors:
- `404 Not Found` if entry does not exist
- `400 Bad Request` if entry has been submitted
- `401 Unauthorized`
- `500 Internal Server Error`

## Student Logbook

### GET /api/student/logbook

Query parameters:
- `page` integer optional
- `limit` integer optional
- `status` `DRAFT` | `PENDING` | `APPROVED` | `REJECTED` optional
- `startDate` string optional
- `endDate` string optional

Response:
- `200 OK`
- The endpoint returns the raw result object from the student logbook service, including entries and pagination.

Authorization:
- `STUDENT` only

Errors:
- `401 Unauthorized`
- `404 Not Found` if the student profile is missing
- `400 Bad Request` for invalid query params
- `500 Internal Server Error`

### POST /api/student/logbook

Request body:
- `learningPathId` string
- `projectId` string
- `milestoneId` string
- `milestoneTaskId` string
- `title` string
- `description` string
- `activities` string
- `hoursWorked` number optional
- `challenges` string optional
- `learnings` string optional
- `date` string (ISO)
- `status` `DRAFT` | `PENDING` | `APPROVED` | `REJECTED` optional
- `attachments` string[] optional
- `evidenceItems` array optional

Behavior:
- Requires the student to have an active attendance session for today.
- Validates the selected project, milestone, task, and active learning path.

Response:
- `200 OK`
- `{ success: true, message: "Logbook entry created successfully", entry: { ... } }`

Errors:
- `400 Bad Request` for invalid data or invalid project/milestone/task/learning path
- `403 Forbidden` if the student has not checked in
- `404 Not Found` if the student profile is missing
- `401 Unauthorized`
- `500 Internal Server Error`

### GET /api/student/logbook/[id]

Response:
- `200 OK`
- `{ success: true, entry: { ... } }`

Errors:
- `404 Not Found` if the entry does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/student/logbook/[id]

Request body:
- optional fields from the POST schema

Behavior:
- Cannot edit entries with status `APPROVED` or `REJECTED`.
- Validates any changed learning path, project, milestone, or task relationships.

Response:
- `200 OK`
- `{ success: true, message: "Logbook entry updated successfully", entry: { ... } }`

Errors:
- `400 Bad Request` for invalid data or business rules
- `404 Not Found` if entry or student profile is missing
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/student/logbook/[id]

Behavior:
- Only entries with status `DRAFT` may be deleted.

Response:
- `200 OK`
- `{ success: true, message: "Logbook entry deleted successfully" }`

Errors:
- `404 Not Found` if entry or student profile is missing
- `400 Bad Request` if entry has been submitted or reviewed
- `401 Unauthorized`
- `500 Internal Server Error`

## Supervisor Review

### GET /api/supervisor/review

Query parameters:
- `page` integer optional
- `limit` integer optional
- `status` `PENDING` | `APPROVED` | `REJECTED` | `DRAFT` optional
- `startDate` string optional
- `endDate` string optional

Response:
- `200 OK`
- `{ entries: [...], pagination: { page, limit, total, pages } }`

Authorization:
- `SUPERVISOR` only

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`
