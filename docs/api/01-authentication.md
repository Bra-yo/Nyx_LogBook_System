# Authentication

## Overview

Authentication in the BGHUB WorkLog Management System is built on NextAuth using a credentials provider. Users sign in with email and password. The system verifies credentials against the Prisma `User` model, enforces active status, and returns a JWT-based session containing role, profile metadata, and account/payment state.

The authentication implementation uses the following core components:

- `src/lib/auth.ts` — NextAuth configuration and credential authorization.
- `src/app/api/auth/credentials-check/route.ts` — credential validation endpoint used by the front end to verify login input.
- `src/app/api/auth/change-password/route.ts` — authenticated password change endpoint.
- `src/types/next-auth.d.ts` — extended NextAuth session and JWT types.
- `src/proxy.ts` — route protection middleware based on role and sign-in status.
- `prisma/schema.prisma` — `User` model and supported status / role enums.

## Login Flow

Authentication follows this flow:

1. User submits email and password to the credentials provider.
2. `authorizeCredentials()` in `src/lib/auth.ts` loads the user by `email` from Prisma.
3. The submitted password is compared against the stored bcrypt hash.
4. If the user is inactive or a student without active `accountStatus`, login is rejected with a descriptive error.
5. If valid, the returned user object is stored in the JWT and session callbacks.
6. The application uses `getServerSession(authOptions)` to read authenticated session state on protected routes.

## Session Strategy

The system uses NextAuth session strategy `jwt`.

- `authOptions.session.strategy` is set to `jwt`.
- The `jwt` callback enriches the token with:
  - `role`
  - `profile`
  - `mustChangePassword`
  - `registrationIdentifier`
  - `accountStatus`
  - `paymentStatus`
- The `session` callback maps JWT fields onto `session.user`.

This means session state is stored as a signed JSON Web Token and includes application-specific user metadata.

## User Roles

User role values are defined by the Prisma `UserRole` enum and are used throughout authentication and authorization.

From the implementation, supported roles include at least:

- `ADMIN`
- `STUDENT`
- `SUPERVISOR`
- `LECTURER`
- `WORKER`

These roles are assigned on `User.role` and propagated into session state.

## Protected Routes

Route protection is enforced by both the auth session and in-route role checks.

### Proxy protection

`src/proxy.ts` protects application routes by:

- allowing only requests with a session cookie for signed-in users
- redirecting unauthenticated requests to `/auth/signin`
- redirecting authenticated users to role-specific home routes
- granting access to public auth pages and assets

### In-route role checks

API route handlers validate `session.user.role` explicitly.

Examples:

- `auth/change-password` requires an authenticated session and checks `session.user.id`.
- `supervisor/review` requires `session.user.role === 'SUPERVISOR'`.
- worker attendance endpoints require `session.user.role === 'WORKER'`.
- admin APIs require `session.user.role === 'ADMIN'`.

## Authorization

Authorization is primarily role-based and may combine role checks with resource ownership.

Key rules:

- In `authorizeCredentials()`, login is blocked when `user.isActive` is `false`.
- Student logins are blocked unless `accountStatus === 'ACTIVE'`.
- Session callbacks ensure the client session contains role and profile metadata to support UI-level access decisions.
- API handlers deny unauthorized access with `401 Unauthorized` or `403 Unauthorized` based on missing session or insufficient role.

## Password Change

Authenticated users can change passwords via `POST /api/auth/change-password`.

Validation rules:

- `currentPassword` is required.
- `newPassword` must be at least 8 characters.
- `newPassword` must contain:
  - one uppercase letter
  - one lowercase letter
  - one number
  - one special character
- `newPassword` cannot equal the default password `ChangeMe123`.
- `confirmPassword` must match `newPassword`.
- `currentPassword` must match the existing hashed password.
- The new password must be different from the current password.

On success, the user's `password` is updated and `mustChangePassword` is set to `false`.

## Authentication Endpoints

### POST /api/auth/credentials-check

Validates login credentials without creating a session.

Request:

- Content-Type: `application/json`
- Body:
  - `email` (string)
  - `password` (string)

Response:

- `200 OK`
- Body:
  - `success`: `true` if credentials are valid, otherwise `false`
  - `error`: string message when validation fails

Errors:

- `400 Bad Request` when `email` or `password` is missing.
  - Example: `{ success: false, error: "Please enter your email and password." }`
- `401 Unauthorized` when credentials are invalid or account restrictions apply.
  - Example: `{ success: false, error: "Authentication failed" }`
- `500 Internal Server Error` on unexpected failures.

### POST /api/auth/change-password

Allows an authenticated user to change their password.

Request:

- Requires authenticated session via NextAuth.
- Content-Type: `application/json`
- Body:
  - `currentPassword` (string)
  - `newPassword` (string)
  - `confirmPassword` (string)

Response:

- `200 OK`
- Body:
  - `success`: `true`
  - `message`: `Password changed successfully`

Errors:

- `401 Unauthorized` when no authenticated session is present.
  - Example: `{ error: "Unauthorized" }`
- `400 Bad Request` when request validation fails.
  - Example: `{ error: "Invalid request data", details: [...] }`
  - Example: `{ error: "Current password is incorrect" }`
  - Example: `{ error: "New password must be different from current password" }`
- `404 Not Found` when the authenticated user record cannot be found.
  - Example: `{ error: "User not found" }`
- `500 Internal Server Error` on unexpected failures.

## User Model and Auth Metadata

The Prisma `User` model provides authentication state and metadata used by auth logic.

Relevant fields:

- `id`: unique identifier
- `email`: login identifier
- `password`: bcrypt hash stored in the database
- `role`: user role used for authorization
- `isActive`: active account flag
- `mustChangePassword`: indicates password reset enforcement
- `registrationIdentifier`: optional onboarding identifier
- `accountStatus`: account activation state
- `paymentStatus`: payment compliance state

The `authorizeCredentials()` method also loads related profile records from
`studentProfile`, `supervisorProfile`, `lecturerProfile`, and `adminProfile`.

If authentication succeeds, session state includes:

- `session.user.id`
- `session.user.role`
- `session.user.profile`
- `session.user.mustChangePassword`
- `session.user.registrationIdentifier`
- `session.user.accountStatus`
- `session.user.paymentStatus`
