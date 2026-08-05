# User Management

## Overview

The user management API supports admin operations for listing, creating, retrieving, updating, and deleting users. These endpoints are restricted to `ADMIN` users and work with the Prisma `User` model and associated role profiles.

Supported roles in the user APIs include:

- `STUDENT`
- `SUPERVISOR`
- `ADMIN`
- `LECTURER`
- `WORKER`

### Relevant Prisma `User` fields

- `id`
- `email`
- `name`
- `role`
- `isActive`
- `mustChangePassword`
- `registrationIdentifier`
- `phone`
- `paymentStatus`
- `accountStatus`
- `createdAt`
- `updatedAt`

Associated profile relations are included for `studentProfile`, `supervisorProfile`, `lecturerProfile`, and `adminProfile`.

## Endpoints

### GET /api/admin/users

Fetch a paginated list of users with optional filters.

Request

- Query parameters:
  - `page` (string, optional, default `1`)
  - `limit` (string, optional, default `10`)
  - `role` (optional, one of `STUDENT`, `SUPERVISOR`, `LECTURER`, `ADMIN`, `WORKER`)
  - `departmentId` (optional, string)
  - `search` (optional, string)

Response

- `200 OK`
- Body:
  - `users`: array of users with included profile relations and password removed
  - `pagination`:
    - `page`
    - `limit`
    - `total`
    - `pages`

Errors

- `401 Unauthorized` if the caller is not an `ADMIN`.
- `400 Bad Request` when query parameters fail validation.
- `500 Internal Server Error` for unexpected failures.

### POST /api/admin/users

Create a new user account and role-specific profile.

Request

- Body JSON:
  - `name` (string, required)
  - `email` (string, required, email format)
  - `role` (required, one of `STUDENT`, `SUPERVISOR`, `ADMIN`)
  - `departmentId` (optional)
  - `learningAreaId` (required for learner accounts)
  - `title` (optional)
  - `company` (optional)
  - `office` (optional)
  - `permissions` (optional array of strings)
  - `organization` (optional)
  - `phone` (optional)
  - `registrationType` (optional, `CAREER_MENTEE` or `BUSINESS_MENTEE`)
  - `mentorshipTrack` (optional, `CAREER` or `BUSINESS`)
  - `cohortId` (optional)
  - `mentorCapacity` (optional integer 1-500)
  - `employmentType` (optional)
  - `competencyIds` (optional array of competency IDs)
  - `competencyGroupIds` (optional array of competency group IDs)

Behavior

- Requires `ADMIN` role.
- Rejects duplicate email addresses.
- Uses `DEFAULT_USER_PASSWORD` or `ChangeMe123` for initial password.
- Hashes the password with bcrypt.
- Sets `mustChangePassword` to `true`.
- For `STUDENT` role, verifies cohort availability when `cohortId` is provided.
- Creates a role-specific profile within a transaction.
- For `STUDENT`, validates `learningAreaId` exists.
- For `SUPERVISOR`, requires at least one competency and associated competency groups.

Response

- `201 Created`
- Body:
  - `success`: `true`
  - `user`: created user record with `password` removed

Errors

- `401 Unauthorized` if the caller is not an `ADMIN`.
- `400 Bad Request` when request validation fails.
- `400 Bad Request` if email already exists.
- `404 Not Found` when referenced `cohortId`, `learningAreaId`, or `competencyGroupIds` are invalid.
- `500 Internal Server Error` for unexpected failures.

### GET /api/admin/users/{id}

Fetch a single user by ID with related profile information.

Request

- Path parameter:
  - `id` (string)

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `user`: user record with related profile relations and `password` removed

Errors

- `401 Unauthorized` if the caller is not an `ADMIN`.
- `404 Not Found` if no user exists with that ID.
- `500 Internal Server Error` for unexpected failures.

### PUT /api/admin/users/{id}

Update a user and its role-specific profile.

Request

- Path parameter:
  - `id` (string)
- Body JSON may include:
  - `name` (string)
  - `email` (string, email format)
  - `password` (string, min 6 characters)
  - `isActive` (boolean)
  - `departmentId` (string)
  - `role` (one of `STUDENT`, `SUPERVISOR`, `ADMIN`)
  - `supervisorId` (string)
  - `lecturerId` (string)
  - `title` (string)
  - `company` (string)
  - `organization` (string)
  - `office` (string)
  - `permissions` (array of strings)
  - `phone` (string)
  - `registrationType` (`CAREER_MENTEE` or `BUSINESS_MENTEE`)
  - `mentorshipTrack` (`CAREER` or `BUSINESS`)
  - `cohortId` (string)
  - `learningAreaId` (string)
  - `mentorCapacity` (integer 1-500)
  - `employmentType` (string)
  - `maxActiveMentees` (integer 1-500)
  - `isAcceptingNewMentees` (boolean)

Behavior

- Requires `ADMIN` role.
- Validates email uniqueness when updating email.
- Validates cohort availability when `cohortId` is provided.
- Trims phone input and stores `null` when blank.
- Hashes provided `password` with bcrypt.
- If `role` changes, stale role profiles for the previous role are deleted, and role-specific profile data is upserted for the new role.
- For `STUDENT`, requires `learningAreaId` either in the update or the existing profile.
- Ensures a department is available for student, supervisor, lecturer, or admin profiles.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `message`: `User updated successfully`
  - `user`: updated user record with related profile relations and `password` removed

Errors

- `401 Unauthorized` if the caller is not an `ADMIN`.
- `404 Not Found` if the target user does not exist.
- `400 Bad Request` when request validation fails.
- `400 Bad Request` if the updated email already exists.
- `404 Not Found` if referenced `cohortId` or `learningAreaId` does not exist.
- `500 Internal Server Error` for unexpected failures.

### DELETE /api/admin/users/{id}

Deactivate or permanently delete a user.

Request

- Path parameter:
  - `id` (string)
- Query parameters:
  - `action` (optional, string)
    - `permanent` to delete permanently
    - any other value defaults to deactivate

Behavior

- Requires `ADMIN` role.
- Prevents self-deactivation or self-deletion.
- Prevents deactivating or deleting the last active administrator.
- `action=permanent` triggers a permanent delete via `deleteUserPermanently()`.
- Otherwise, the endpoint soft-deactivates the user by setting `isActive = false`.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `message`: either `User has been deactivated` or `User deleted permanently`

Errors

- `401 Unauthorized` if the caller is not an `ADMIN`.
- `404 Not Found` if no user exists with that ID.
- `400 Bad Request` when attempting to delete or deactivate the calling admin.
- `400 Bad Request` when attempting to delete the last active administrator.
- `500 Internal Server Error` for unexpected failures.

### POST /api/admin/users/{id}/reset-password

Reset a user's password to the default temporary password.

Request

- Path parameter:
  - `id` (string)

Behavior

- Requires `ADMIN` role.
- Prevents resetting the password of the current authenticated admin.
- Sets the user's password to the configured `DEFAULT_USER_PASSWORD` or fallback `ChangeMe123`.
- Sets `mustChangePassword = true`.

Response

- `200 OK`
- Body:
  - `success`: `true`
  - `message`: `Password reset successfully`

Errors

- `401 Unauthorized` if the caller is not an `ADMIN`.
- `400 Bad Request` if attempting to reset the caller's own password.
- `404 Not Found` if no user exists with that ID.
- `500 Internal Server Error` for unexpected failures.
