# 14. API Standards

---

# Purpose

The API Standards document defines how every BGHub API should be designed, implemented, validated, secured, versioned, and documented.

The objective is to maintain a consistent, predictable, secure, and scalable API architecture throughout the platform.

Every new API endpoint must comply with these standards.

---

# API Philosophy

BGHub APIs are designed around the following principles:

- RESTful
- Resource-oriented
- Predictable
- Secure
- Versionable
- Stateless
- Role-aware
- Easy to consume
- Easy to extend

---

# Base URL

Current

/api

Future

/api/v1

Future versions

/api/v2

/api/v3

Versioning must never break existing integrations.

---

# Resource Naming

Resources must use plural nouns.

Correct

/api/users

/api/projects

/api/logbook

/api/learning-areas

/api/competencies

Incorrect

/api/getUsers

/api/createProject

/api/deleteCompetency

The HTTP method defines the action.

---

# Route Organization

Endpoints are grouped by user role.

Examples

/api/admin/...

/api/student/...

/api/supervisor/...

/api/finance/...

/api/public/...

Each role only exposes the resources required for that role.

---

# HTTP Methods

GET

Retrieve data.

Must never modify data.

---

POST

Create new resources.

---

PUT

Replace an existing resource.

---

PATCH

Update part of a resource.

---

DELETE

Archive or remove resources where permitted.

Historical academic records should normally be archived instead of physically deleted.

---

# Response Format

Every response follows a consistent structure.

Success

```json
{
  "success": true,
  "message": "Learning area created successfully.",
  "data": {}
}
```

Failure

```json
{
  "success": false,
  "message": "Learning area already exists.",
  "errors": []
}
```

---

# HTTP Status Codes

200

Request successful.

201

Resource created.

204

Successful request with no response body.

400

Invalid request.

401

Unauthenticated.

403

Unauthorized.

404

Resource not found.

409

Conflict.

422

Validation failed.

429

Too many requests.

500

Internal server error.

---

# Pagination

Large collections must support pagination.

Parameters

page

pageSize

sortBy

sortDirection

Example

```text
GET /api/admin/users?page=2&pageSize=20
```

Response

```json
{
  "data": [],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "totalPages": 8,
    "totalRecords": 155
  }
}
```

---

# Filtering

Collections should support filtering.

Examples

Learning Area

Competency

Status

Role

Project

Mentor

Assessment Status

Date Range

---

Example

```text
GET /api/admin/users?role=MENTOR
```

---

# Searching

Search should support:

Name

Admission Number

Email

Project Name

Competency

Learning Area

Institution

Example

```text
GET /api/admin/users?search=Brian
```

---

# Sorting

Supported parameters

sortBy

sortDirection

Example

```text
GET /api/projects?sortBy=createdAt&sortDirection=desc
```

---

# Validation

All incoming data must be validated before processing.

Validation includes:

Required fields

Data types

Value ranges

String length

Enum validation

Ownership validation

Relationship validation

Business rule validation

---

# Authentication

Protected APIs require authentication.

Unauthenticated requests return

401 Unauthorized

---

# Authorization

Every protected endpoint verifies:

Role

Permissions

Ownership

Examples

Learners

Only own data.

Mentors

Assigned learners only.

Administrators

Institution-wide access.

---

# Business Rules

Validation is not enough.

Every endpoint must enforce business rules.

Examples

Learners cannot choose mentors.

Mentors cannot exceed capacity.

Archived learning paths cannot receive new assessments.

Completed assessments cannot be edited.

Deleted competencies cannot remain active in learning paths.

---

# Transactions

Database transactions must be used when multiple operations must succeed together.

Examples

Assign Learning Area

↓

Generate Learning Paths

↓

Allocate Mentor

↓

Create Notifications

↓

Commit

If one step fails, all changes must roll back.

---

# Error Messages

Messages should be user-friendly.

Good

"Payment has not yet been verified."

Bad

"Prisma P2025 Error"

---

# File Upload APIs

Uploads must validate:

File type

File size

Ownership

Virus scan (future)

Supported types

PDF

DOCX

PNG

JPG

JPEG

MP4

ZIP (future)

---

# Audit Logging

Sensitive APIs must log:

User

Action

Timestamp

Affected Resource

Old Value

New Value

IP Address (future)

---

# Performance

Endpoints should:

Avoid N+1 queries.

Use pagination.

Select only required fields.

Use indexes.

Avoid duplicate queries.

Support caching where appropriate.

---

# API Documentation

Every endpoint should document:

Purpose

Required permissions

Request body

Query parameters

Response

Possible errors

Example requests

Example responses

---

# Naming Conventions

Endpoints

Use lowercase.

Use hyphens.

Examples

learning-areas

competency-groups

mentor-allocations

Never use camelCase in URLs.

---

# Date Standards

Dates should use ISO-8601.

Example

2026-08-03T15:30:00Z

---

# Soft Deletes

Academic records should use soft deletion where possible.

Examples

Projects

Competencies

Learning Paths

Assessments

Notifications

The system should preserve historical integrity.

---

# Future Enhancements

API Versioning

OpenAPI Documentation

Swagger UI

GraphQL Gateway

Webhook Support

Public Integration APIs

Institution APIs

Mobile APIs

---

# Related Documents

13_SECURITY_AND_PERMISSIONS.md

15_DATABASE_CONVENTIONS.md

17_DEVELOPMENT_RULES.md

19_TESTING_AND_ACCEPTANCE.md