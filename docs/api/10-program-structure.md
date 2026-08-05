# Program Structure

## Overview

Program structure endpoints cover learner learning path management and curriculum package import.

## Learner Learning Paths

### GET /api/admin/learner-learning-paths

Response:
- `200 OK`
- `{ success: true, learnerLearningPaths: [...] }`

Authorization:
- `ADMIN` only

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

### POST /api/admin/learner-learning-paths

Request body:
- `learnerId` string
- `competencyId` string
- `status` `PLANNED` | `ACTIVE` | `PAUSED` | `COMPLETED` | `ARCHIVED` optional
- `startedAt` date optional
- `completedAt` date optional

Behavior:
- Creates a learner learning path.
- Rejects a new active path when the learner already has an active path for the same competency.

Response:
- `201 Created`
- `{ success: true, learnerLearningPath: { ... } }`

Errors:
- `400 Bad Request`
- `404 Not Found` if learner or competency does not exist
- `409 Conflict` for duplicate active learning path
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/admin/learner-learning-paths/[id]

Request body: same as POST, all fields optional.

Behavior:
- Updates an existing learner learning path.
- Enforces valid status transitions:
  - `PLANNED` → `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`
  - `ACTIVE` → `PAUSED`, `COMPLETED`, `ARCHIVED`
  - `PAUSED` → `ACTIVE`, `COMPLETED`, `ARCHIVED`
  - `COMPLETED` → `ARCHIVED`
  - `ARCHIVED` → no further transitions
- Rejects duplicate active paths for the same learner and competency.

Response:
- `200 OK`
- `{ success: true, learnerLearningPath: { ... } }`

Errors:
- `400 Bad Request` for invalid transition or invalid data
- `404 Not Found` if the record, learner, or competency does not exist
- `409 Conflict` for duplicate active learning path
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/admin/learner-learning-paths/[id]

Behavior:
- Deletion is not permitted; the endpoint returns a business-rule error.

Response:
- `400 Bad Request`
- `{ success: false, error: "Learning history cannot be deleted" }`

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

## Curriculum Import

### POST /api/admin/curriculum/import

Request body:
- `packageIds` string[]

Behavior:
- Imports the selected curriculum packages.
- Rejects the request if no valid package IDs are supplied.

Response:
- `200 OK`
- `{ success: true, summary: { ... } }`

Errors:
- `400 Bad Request` if no curriculum packages are selected
- `401 Unauthorized`
- `500 Internal Server Error`
