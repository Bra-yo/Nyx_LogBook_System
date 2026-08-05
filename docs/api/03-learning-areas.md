# Learning Areas

## Overview

The Learning Areas API exposes admin management for learning area taxonomy, learner learning paths, and curriculum package import. All endpoints documented here require `ADMIN` authentication and operate against Prisma models defined in `prisma/schema.prisma`.

Key models involved:

- `LearningArea`
- `Competency`
- `CompetencyGroup`
- `LearnerLearningPath`

The curriculum import flow uses a package registry in `src/lib/curriculum/registry.ts` and imports definitions into the database using `src/lib/curriculum/import-service.ts`.

## Admin Learning Area Endpoints

### GET /api/admin/learning-areas

Fetch all learning areas.

Request

- No request body.
- Requires authenticated `ADMIN` session.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `learningAreas`: array of learning area records
    - each includes `_count.competencies`

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `500 Internal Server Error` on failure.

### POST /api/admin/learning-areas

Create a new learning area.

Request

- Content-Type: `application/json`
- Body:
  - `name` (string, required)
  - `description` (string, optional)
  - `status` (optional, `ACTIVE` or `INACTIVE`)
  - `sortOrder` (optional integer)

Behavior

- Requires `ADMIN` role.
- Normalizes the provided `name`.
- Automatically generates a `code` from the name.
- Rejects duplicate name or code.
- Defaults `status` to `ACTIVE` and `sortOrder` to `0`.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `learningArea`: created learning area record

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `400 Bad Request` when request validation fails.
- `409 Conflict` when a learning area with the same name or generated code already exists.
- `500 Internal Server Error` on failure.

### PUT /api/admin/learning-areas/{id}

Update an existing learning area.

Request

- Path parameter: `id`
- Content-Type: `application/json`
- Body:
  - `name` (string, required)
  - `description` (string, optional)
  - `status` (optional, `ACTIVE` or `INACTIVE`)
  - `sortOrder` (optional integer)

Behavior

- Requires `ADMIN` role.
- Loads the existing learning area by `id`.
- Recomputes `code` only if the name changes.
- Rejects name or code duplicates excluding the current record.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `learningArea`: updated learning area record

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `400 Bad Request` when request validation fails.
- `404 Not Found` if the learning area does not exist.
- `409 Conflict` when the new name or generated code duplicates another learning area.
- `500 Internal Server Error` on failure.

### DELETE /api/admin/learning-areas/{id}

Delete a learning area.

Request

- Path parameter: `id`
- No body.
- Requires authenticated `ADMIN` session.

Response

- `200 OK`
- Body:
  - `success`: `true`

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `404 Not Found` if the learning area does not exist.
- `500 Internal Server Error` on failure.

## Admin Learner Learning Path Endpoints

### GET /api/admin/learner-learning-paths

Fetch all learner learning paths.

Request

- No body.
- Requires `ADMIN` role.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `learnerLearningPaths`: array of learner learning path records
    - each includes `learner` with `id`, `name`, `email`
    - each includes `competency` with `id`, `name`, `code`

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `500 Internal Server Error` on failure.

### POST /api/admin/learner-learning-paths

Create a learner learning path.

Request

- Content-Type: `application/json`
- Body:
  - `learnerId` (string, required)
  - `competencyId` (string, required)
  - `status` (optional, one of `PLANNED`, `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`)
  - `startedAt` (optional datetime string)
  - `completedAt` (optional datetime string)

Behavior

- Requires `ADMIN` role.
- Validates learner and competency exist.
- Defaults `status` to `PLANNED`.
- Prevents creating a second `ACTIVE` learning path for the same learner and competency.

Response

- `201 Created`
- Body:
  - `success`: `true`
  - `learnerLearningPath`: created record with learner and competency details

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `400 Bad Request` when request validation fails.
- `404 Not Found` when learner or competency is missing.
- `409 Conflict` when an active path already exists for the same learner and competency.
- `500 Internal Server Error` on failure.

### PUT /api/admin/learner-learning-paths/{id}

Update a learner learning path.

Request

- Path parameter: `id`
- Content-Type: `application/json`
- Body may include:
  - `learnerId` (string)
  - `competencyId` (string)
  - `status` (one of `PLANNED`, `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`)
  - `startedAt` (optional datetime string)
  - `completedAt` (optional datetime string)

Behavior

- Requires `ADMIN` role.
- Loads the existing learning path by `id`.
- Validates permitted status transitions:
  - `PLANNED` → `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED`
  - `ACTIVE` → `PAUSED`, `COMPLETED`, `ARCHIVED`
  - `PAUSED` → `ACTIVE`, `COMPLETED`, `ARCHIVED`
  - `COMPLETED` → `ARCHIVED`
  - `ARCHIVED` → none
- Validates learner and competency if changed.
- Prevents another active path for the same learner and competency when updating to `ACTIVE`.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `learnerLearningPath`: updated record with learner and competency details

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `400 Bad Request` when request validation fails.
- `400 Bad Request` for invalid status transitions.
- `404 Not Found` if the learning path, learner, or competency does not exist.
- `409 Conflict` when another active path would be duplicated.
- `500 Internal Server Error` on failure.

### DELETE /api/admin/learner-learning-paths/{id}

Attempting to delete a learner learning path is rejected.

Request

- Path parameter: `id`
- No body.
- Requires `ADMIN` role.

Response

- `400 Bad Request`
- Body:
  - `success`: `false`
  - `error`: `Learning history cannot be deleted`

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `404 Not Found` if the learning path does not exist.
- `500 Internal Server Error` on failure.

## Admin Curriculum Import Endpoint

### POST /api/admin/curriculum/import

Import curriculum packages from the registry into the database.

Request

- Content-Type: `application/json`
- Body:
  - `packageIds` (array of strings)

Behavior

- Requires `ADMIN` role.
- Loads registered curriculum packages from `src/lib/curriculum/registry.ts`.
- Filters packages by the provided `packageIds`.
- Returns a validation error when no matching packages are selected.
- Imports learning areas, competencies, and competency groups using `src/lib/curriculum/import-service.ts`.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `summary`: import summary object containing:
    - `learningAreasCreated`
    - `competenciesCreated`
    - `competencyGroupsCreated`
    - `skippedDuplicates`
    - `processingTimeMs`
    - `packagesImported`
    - `packagesSkipped`

Errors

- `401 Unauthorized` if the caller is not `ADMIN`.
- `400 Bad Request` if no curriculum packages are selected.
- `500 Internal Server Error` on failure.
