# 15. Database Conventions

---

# Purpose

This document defines the database architecture, modeling standards, naming conventions, migration strategy, indexing guidelines, and integrity rules for BGHub.

All database changes must follow these conventions to ensure consistency, scalability, maintainability, and historical integrity.

BGHub currently uses:

- PostgreSQL
- Prisma ORM

---

# Design Principles

The database must always be:

- Normalized
- Consistent
- Auditable
- Scalable
- Extensible
- Secure
- Predictable

Academic history must never be compromised.

---

# Primary Keys

Every table uses:

```text
id String @id @default(cuid())
```

Rules:

- Never use auto-increment integers.
- Never expose sequential identifiers.
- IDs must remain globally unique.

---

# Foreign Keys

Foreign keys should always end with **Id**.

Examples

```text
studentId

mentorId

learningAreaId

competencyId

projectId

learningPathId
```

Avoid ambiguous names.

Bad

```text
user

mentor

student
```

Good

```text
userId

mentorId

studentId
```

---

# Table Naming

Prisma models use PascalCase.

Examples

```text
StudentProfile

LearningArea

Competency

Project

LogbookEntry
```

Database tables use Prisma defaults unless explicitly mapped.

---

# Field Naming

Fields use camelCase.

Examples

```text
createdAt

updatedAt

completedAt

learningAreaId

portfolioVisibility
```

Avoid abbreviations.

Bad

```text
dept

comp

proj
```

Good

```text
departmentName

competencyLevel

projectStatus
```

---

# Timestamp Fields

Every major entity must contain:

```text
createdAt

updatedAt
```

Where appropriate, also include:

```text
deletedAt

completedAt

approvedAt

submittedAt

reviewedAt
```

---

# Soft Deletes

Historical academic records should never be permanently deleted.

Instead use:

```text
isArchived

deletedAt

status
```

Examples:

Learning Paths

Projects

Assessments

Logbooks

Notifications

Certificates

---

# Audit Fields

Sensitive entities should record:

```text
createdById

updatedById

approvedById

reviewedById
```

Future enhancements may include:

```text
lastModifiedBy

ipAddress

device

userAgent
```

---

# Enumerations

Use enums instead of free text whenever possible.

Examples

```text
ProjectStatus

AssessmentStatus

LogbookStatus

PaymentStatus

NotificationPriority

MentorAllocationStatus
```

Avoid string comparisons throughout the application.

---

# Relationships

Prefer explicit relationships.

Example

```prisma
student StudentProfile
studentId String
```

instead of storing only names.

Never duplicate relational data.

---

# Many-to-Many Relationships

Always model explicitly when additional metadata is required.

Example

```text
MentorCompetencyGroup

LearnerLearningPath

LearnerMentorAllocation
```

Avoid implicit many-to-many relationships where historical data is important.

---

# Cascade Rules

Use cascading deletes carefully.

Recommended:

```text
Cascade

Temporary child records

Session records

Tokens
```

Avoid cascade deletion for:

Projects

Learning Paths

Competencies

Assessments

Logbooks

Portfolios

Certificates

Academic records must remain intact.

---

# Unique Constraints

Use unique indexes where required.

Examples

Email

Admission Number

Institution Registration Number

Learning Area Code

Competency Code

Duplicate active mentor allocations

Duplicate active learning paths

---

# Composite Constraints

Use composite uniqueness where appropriate.

Examples

```text
(studentId, competencyId)

(mentorId, competencyGroupId)

(projectId, learnerId)
```

---

# Indexing

Frequently queried fields must be indexed.

Examples

```text
studentId

mentorId

projectId

learningAreaId

competencyId

status

createdAt

updatedAt
```

Composite indexes should be used for common filters.

---

# JSON Fields

Use JSON only when data is genuinely dynamic.

Examples

Notification metadata

Analytics cache

Export settings

Avoid storing relational data in JSON.

---

# File Storage

The database stores only metadata.

Actual files should be stored externally.

Database fields include:

```text
fileName

fileUrl

mimeType

fileSize

uploadedAt
```

Never store binary files directly in PostgreSQL.

---

# Transactions

Use Prisma transactions whenever multiple operations must succeed together.

Example

Assign Learning Area

↓

Generate Learning Paths

↓

Allocate Mentor

↓

Create Notifications

↓

Commit

If one operation fails, rollback everything.

---

# Migration Rules

Every migration must:

Be reversible where possible.

Use meaningful names.

Contain only related changes.

Be committed to version control.

Example

```text
20260804_add_competency_assessments
```

Avoid vague names like:

```text
update_schema

fix_database

changes
```

---

# Historical Integrity

Never overwrite historical records.

Instead:

Create new assessment versions.

Archive learning paths.

Maintain previous mentor allocations.

Retain completed projects.

Preserve portfolio history.

---

# Data Integrity Rules

The database must prevent:

Duplicate active learning paths.

Duplicate mentor allocations.

Invalid competency references.

Orphaned records.

Broken foreign keys.

Invalid assessment states.

---

# Performance Guidelines

Avoid N+1 queries.

Use pagination.

Use selective field loading.

Avoid loading unnecessary relationships.

Use aggregation queries for analytics.

Cache expensive reports when appropriate.

---

# Seed Data

The database should provide default seed data for:

Learning Areas

Competencies

Competency Groups

System Roles

Notification Templates

Assessment Levels

Portfolio Visibility

Default Settings

These should remain editable by administrators after seeding.

---

# Backup Strategy

Production deployments should support:

Daily backups.

Point-in-time recovery.

Migration rollback.

Disaster recovery procedures.

---

# Future Enhancements

Database Partitioning

Read Replicas

Multi-Tenant Architecture

Institution Isolation

Event Sourcing

CQRS

Search Index Integration

Data Warehouse Integration

---

# Related Documents

02_DOMAIN_MODEL.md

04_CURRICULUM_ENGINE.md

05_MENTORSHIP_ENGINE.md

14_API_STANDARDS.md

17_DEVELOPMENT_RULES.md