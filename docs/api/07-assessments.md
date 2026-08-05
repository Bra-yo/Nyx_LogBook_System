# Assessments

## Overview

Assessment endpoints cover admin competency assessments, supervisor competency assessments, student competency assessments, student assessment dashboard summaries, and supervisor logbook assessments.

## Admin Competency Assessments

### GET /api/admin/competency-assessments

Response:
- `200 OK`
- `{ success: true, assessments: [...], availableLearningPaths: [...] }`

Authorization:
- `ADMIN` only

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

### POST /api/admin/competency-assessments

Request body:
- `learningPathId` string
- `score` integer 1-5
- `level` `NOT_YET_DEMONSTRATED` | `EMERGING` | `COMPETENT` | `PROFICIENT` | `EXPERT` optional
- `comments` string
- `evidence` string optional
- `status` `DRAFT` | `SUBMITTED` | `FINAL` optional

Behavior:
- Requires admin profile.
- Rejects archived learning paths.
- Enforces `comments` length of at least 10 characters.

Response:
- `201 Created`
- `{ success: true, assessment: { ... } }`

Errors:
- `400 Bad Request` for invalid input or archived learning paths
- `404 Not Found` if admin profile or learning path is missing
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/admin/competency-assessments/[id]

Request body: same as POST, all fields optional.

Behavior:
- Requires ownership by the authenticated admin.
- Prevents modification of `FINAL` assessments.
- Rejects archived learning paths and enforces comment length.

Response:
- `200 OK`
- `{ success: true, assessment: { ... } }`

Errors:
- `400 Bad Request`
- `403 Forbidden` if the admin does not own the assessment
- `404 Not Found` if assessment or learning path is missing
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/admin/competency-assessments/[id]

Behavior:
- Only `DRAFT` assessments can be deleted.
- Requires ownership by the authenticated admin.

Response:
- `200 OK`
- `{ success: true, message: "Assessment deleted" }`

Errors:
- `400 Bad Request` if assessment is not draft
- `403 Forbidden` if the admin does not own the assessment
- `404 Not Found` if assessment does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

## Supervisor Competency Assessments

### GET /api/supervisor/competency-assessments

Response:
- `200 OK`
- `{ success: true, assessments: [...], availableLearningPaths: [...] }`

Authorization:
- `SUPERVISOR` only

Errors:
- `401 Unauthorized`
- `404 Not Found` if supervisor profile is missing
- `500 Internal Server Error`

### POST /api/supervisor/competency-assessments

Request body:
- `learningPathId` string
- `score` integer 1-5
- `level` `NOT_YET_DEMONSTRATED` | `EMERGING` | `COMPETENT` | `PROFICIENT` | `EXPERT` optional
- `comments` string
- `evidence` string optional
- `status` `DRAFT` | `SUBMITTED` | `FINAL` optional

Behavior:
- Requires an active mentor allocation for the selected learning path.
- Rejects archived learning paths.
- Enforces comments length of at least 10 characters.

Response:
- `201 Created`
- `{ success: true, assessment: { ... } }`

Errors:
- `400 Bad Request`
- `403 Forbidden` if not actively assigned to the learning path
- `404 Not Found` if supervisor profile or learning path is missing
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/supervisor/competency-assessments/[id]

Behavior:
- Requires ownership by the authenticated supervisor.
- Prevents modification of `FINAL` assessments.
- Enforces active mentor assignment and non-archived learning path.

Response:
- `200 OK`
- `{ success: true, assessment: { ... } }`

Errors:
- `400 Bad Request`
- `403 Forbidden` if the supervisor does not own the assessment or is not actively assigned
- `404 Not Found`
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/supervisor/competency-assessments/[id]

Behavior:
- Only `DRAFT` assessments can be deleted.
- Requires ownership by the authenticated supervisor.

Response:
- `200 OK`
- `{ success: true, message: "Assessment deleted" }`

Errors:
- `400 Bad Request`
- `403 Forbidden`
- `404 Not Found`
- `401 Unauthorized`
- `500 Internal Server Error`

## Student Competency Assessments

### GET /api/student/competency-assessments?learningPathId=...

Query parameters:
- `learningPathId` string required

Response:
- `200 OK`
- `{ success: true, assessments: [...] }`

Authorization:
- `STUDENT` only

Errors:
- `400 Bad Request` if `learningPathId` is missing or invalid
- `401 Unauthorized`
- `500 Internal Server Error`

## Student Competency Dashboard

### GET /api/student/competency-dashboard

Response:
- `200 OK`
- `{ success: true, learningPaths, assessmentSummary, statusCounts, averageScore, progressPercentage, totalLearningPaths, totalFinalAssessments, recentFinalAssessments }`

Authorization:
- `STUDENT` only

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

## Supervisor Logbook Assessment

### GET /api/supervisor/assessment

Response:
- `200 OK`
- `{ success: true, competencyLevels: [...] }`

Authorization:
- `SUPERVISOR` only

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

### POST /api/supervisor/assessment

Request body:
- `logbookEntryId` string
- `competencyScore` integer 1-5
- `optionalComment` string optional
- `status` `APPROVED` | `NEEDS_REVISION` | `REJECTED`

Behavior:
- Creates or updates a supervisor comment record.
- Updates the logbook entry status to `APPROVED`, `REJECTED`, or `PENDING`.

Response:
- `200 OK`
- `{ success: true, message: "Assessment saved successfully", assessment: { ... } }`

Errors:
- `400 Bad Request` for invalid data or competency score
- `404 Not Found` if supervisor profile or logbook entry is missing
- `401 Unauthorized`
- `500 Internal Server Error`
