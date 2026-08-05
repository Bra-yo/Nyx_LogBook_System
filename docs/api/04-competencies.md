# Competencies

## Overview

The competency domain includes admin-managed competencies, competency groups, and mentor expertise assignments.
All endpoints are restricted to `ADMIN` users.

## Endpoints

### GET /api/admin/competencies

Query parameters:
- `learningAreaId` (optional)

Response:
- `200 OK`
- `{ success: true, competencies: [...] }`

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

### POST /api/admin/competencies

Request body:
- `learningAreaId` string
- `name` string
- `description` string|null optional
- `status` `ACTIVE` | `INACTIVE` optional
- `difficulty` `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `EXPERT` optional|null
- `estimatedDurationWeeks` integer optional|null
- `sortOrder` integer optional

Behavior:
- Validates payload with Zod.
- Builds a competency code using the learning area code and a sequence number: `{learningAreaCode}-KC-{sequence}`.
- Duplicate competency names within the same learning area are rejected.

Response:
- `200 OK`
- `{ success: true, competency: { ... } }`

Errors:
- `400 Bad Request` for invalid data
- `404 Not Found` if learning area does not exist
- `409 Conflict` when a duplicate competency exists
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/admin/competencies/[id]

Request body: same as POST.

Behavior:
- Updates a competency.
- If `learningAreaId` changes, the competency code is rebuilt for the new area.
- Prevents name conflicts within the target learning area.

Response:
- `200 OK`
- `{ success: true, competency: { ... } }`

Errors:
- `400 Bad Request` for invalid data
- `404 Not Found` if competency or learning area is missing
- `409 Conflict` for duplicate name
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/admin/competencies/[id]

Response:
- `200 OK`
- `{ success: true }`

Errors:
- `404 Not Found` if the competency does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

## Competency Groups

### GET /api/admin/competency-groups

Query parameters:
- `competencyId` (optional)

Response:
- `200 OK`
- `{ success: true, competencyGroups: [...] }`

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

### POST /api/admin/competency-groups

Request body:
- `competencyId` string
- `name` string
- `description` string|null optional
- `status` `ACTIVE` | `INACTIVE` optional

Behavior:
- Creates a competency group and assigns a generated code: `{competencyCode}-CG-{sequence}`.
- Prevents duplicate group names within the same competency.

Response:
- `201 Created`
- `{ success: true, competencyGroup: { ... } }`

Errors:
- `400 Bad Request` for invalid data
- `404 Not Found` if competency does not exist
- `409 Conflict` for duplicate competency group name
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/admin/competency-groups/[id]

Request body: same as POST.

Behavior:
- Updates a competency group.
- If `competencyId` changes, the code is rebuilt for the new competency.
- Prevents duplicate names under the new competency.

Response:
- `200 OK`
- `{ success: true, competencyGroup: { ... } }`

Errors:
- `400 Bad Request`
- `404 Not Found` if group or competency is missing
- `409 Conflict` if a duplicate name exists
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/admin/competency-groups/[id]

Response:
- `200 OK`
- `{ success: true }`

Errors:
- `404 Not Found` if the competency group does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

## Mentor Competency Groups

### GET /api/admin/mentor-competency-groups

Response:
- `200 OK`
- `{ success: true, mentorCompetencyGroups: [...] }`

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

### POST /api/admin/mentor-competency-groups

Request body:
- `mentorId` string
- `competencyGroupId` string
- `status` `ACTIVE` | `INACTIVE` optional
- `notes` string|null optional

Behavior:
- Creates an expertise assignment linking a mentor to a competency group.
- If the exact link already exists, the response returns the existing record with `duplicate: true`.

Response:
- `201 Created` when a new assignment is created
- `200 OK` when the same assignment already exists
- `{ success: true, mentorCompetencyGroup: { ... }, duplicate?: true }`

Errors:
- `400 Bad Request` for invalid data
- `404 Not Found` if mentor or competency group does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/admin/mentor-competency-groups/[id]

Request body: same as POST.

Behavior:
- Updates a mentor expertise record.
- Prevents duplicate mentor/competency-group pairings.

Response:
- `200 OK`
- `{ success: true, mentorCompetencyGroup: { ... } }`

Errors:
- `400 Bad Request`
- `404 Not Found` if record, mentor, or competency group is missing
- `409 Conflict` for duplicate pairing
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/admin/mentor-competency-groups/[id]

Response:
- `200 OK`
- `{ success: true }`

Errors:
- `404 Not Found` if record does not exist
- `401 Unauthorized`
- `500 Internal Server Error`
