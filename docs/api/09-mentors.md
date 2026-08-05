# Mentors

## Overview

Mentor endpoints cover mentor competency expertise assignments and active mentor allocations for learner learning paths.

## Mentor Competency Groups

### GET /api/admin/mentor-competency-groups

Response:
- `200 OK`
- `{ success: true, mentorCompetencyGroups: [...] }`

Authorization:
- `ADMIN` only

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
- Creates a new mentor-to-competency-group assignment.
- Returns an existing assignment if the same mentor and competency group are already linked.

Response:
- `201 Created` for a new assignment
- `200 OK` with `duplicate: true` for an existing assignment
- `{ success: true, mentorCompetencyGroup: { ... }, duplicate?: true }`

Errors:
- `400 Bad Request`
- `404 Not Found` if mentor or competency group does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/admin/mentor-competency-groups/[id]

Request body: same as POST.

Behavior:
- Updates an existing mentor competency expertise record.
- Prevents duplicate mentor/group pairings.

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
- `404 Not Found`
- `401 Unauthorized`
- `500 Internal Server Error`

## Learner Mentor Allocations

### GET /api/admin/learner-mentor-allocations

Response:
- `200 OK`
- `{ success: true, learnerMentorAllocations: [...] }`

Authorization:
- `ADMIN` only

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`

### POST /api/admin/learner-mentor-allocations

Request body:
- `learningPathId` string
- `mentorId` string
- `status` `PENDING` | `ACTIVE` | `COMPLETED` | `ENDED` | `REASSIGNED` optional
- `allocationReason` `AUTO_MATCH` | `MANUAL_ASSIGNMENT` | `WORKLOAD_BALANCING` | `SPECIALIST_REQUEST` | `MENTOR_LEFT` | `LEARNER_REQUEST` optional
- `allocatedBy` string|null optional
- `startedAt` date optional
- `endedAt` date|null optional
- `notes` string|null optional

Behavior:
- Creates a mentor allocation record.
- Rejects a second active allocation for the same learning path.

Response:
- `201 Created`
- `{ success: true, learnerMentorAllocation: { ... } }`

Errors:
- `400 Bad Request`
- `404 Not Found` if learning path, mentor, or allocator does not exist
- `401 Unauthorized`
- `500 Internal Server Error`

### PUT /api/admin/learner-mentor-allocations/[id]

Request body: same as POST, all fields optional.

Behavior:
- Updates the allocation record.
- Enforces valid status transitions.
- Rejects a duplicate active allocation on the same learning path.

Response:
- `200 OK`
- `{ success: true, learnerMentorAllocation: { ... } }`

Errors:
- `400 Bad Request` for invalid transition or invalid data
- `404 Not Found` if record, learning path, or mentor is missing
- `401 Unauthorized`
- `500 Internal Server Error`

### DELETE /api/admin/learner-mentor-allocations/[id]

Behavior:
- Historical allocations cannot be deleted.

Response:
- `400 Bad Request`
- `{ success: false, error: "Historical allocations cannot be deleted" }`

Errors:
- `401 Unauthorized`
- `500 Internal Server Error`
