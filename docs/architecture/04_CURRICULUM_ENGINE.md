# 04. Curriculum Engine

---

# Purpose

The Curriculum Engine is the academic foundation of BGHub.

It defines:

- what learners study,
- how competencies are organized,
- how mentors specialize,
- how learning paths are generated,
- how projects are assigned,
- and how assessments are measured.

Unlike a traditional Learning Management System (LMS), BGHub is competency-driven rather than subject-driven.

Everything revolves around competencies.

---

# Core Philosophy

BGHub does NOT organize learning using:

- Departments
- Faculties
- Courses
- Subjects

Instead it organizes learning using:

Learning Area

↓

Competencies

↓

Competency Groups

↓

Learning Paths

↓

Projects

↓

Assessments

↓

Portfolio

---

# Curriculum Hierarchy

The hierarchy is fixed.

```

Learning Area
│
├── Competency
│ │
│ ├── Competency Group
│ │ │
│ │ ├── Learning Path
│ │ │ │
│ │ │ ├── Projects
│ │ │ ├── Logbook
│ │ │ ├── Assessments
│ │ │ └── Portfolio

```

No other hierarchy should exist.

---

# Learning Area

A Learning Area represents the broad professional discipline.

Examples:

Software Engineering

Cyber Security

Artificial Intelligence

Cloud Computing

Networking

Data Science

UI/UX Design

DevOps

Mobile Development

Business Analysis

Digital Marketing

---

A learner belongs to exactly ONE Learning Area.

Example

Brian

↓

Software Engineering

Never:

Brian

↓

Software Engineering

↓

Cyber Security

at the same time.

Future versions may support multiple learning areas.

Current version does not.

---

# Competencies

A competency represents a measurable professional skill.

Example

Software Engineering

↓

Git

↓

REST APIs

↓

Authentication

↓

Testing

↓

Docker

↓

Deployment

↓

CI/CD

↓

Clean Architecture

---

Competencies are reusable.

The same competency may belong to multiple learning areas.

Example

Git

belongs to

Software Engineering

AND

Data Science

AND

Cyber Security

---

# Competency Groups

Competencies are grouped into logical learning clusters.

Example

Software Engineering

↓

Backend Development

contains

REST APIs

Authentication

Database Design

Prisma ORM

Caching

Testing

---

Another group

Frontend Development

contains

React

Next.js

TypeScript

TailwindCSS

State Management

Accessibility

---

Purpose

Competency Groups help:

mentor specialization

project assignment

learning path generation

analytics

---

# Learning Templates

BGHub ships with predefined learning templates.

Administrators should not manually create every competency.

Instead the system provides default templates.

Example

Software Engineering

contains

Backend

Frontend

Testing

Deployment

Architecture

Version Control

---

Each template contains:

Learning Area

Competencies

Competency Groups

Suggested Learning Order

Suggested Projects

Suggested Assessments

---

Templates are editable.

Administrators may:

rename

delete

add

reorder

disable

competencies.

---

# Default Curriculum Library

The system must ship with built-in templates.

Minimum templates include:

Software Engineering

Artificial Intelligence

Data Science

Cyber Security

Networking

Cloud Computing

DevOps

UI/UX Design

Mobile Development

Business Analysis

Digital Marketing

Database Administration

IT Support

System Administration

Embedded Systems

---

Each template should contain between:

20–60 competencies

organized into groups.

---

# Learning Order

Competencies may have prerequisites.

Example

Git

↓

GitHub

↓

Branching

↓

Pull Requests

↓

CI/CD

---

The engine should prevent impossible learning paths.

Example

Do NOT recommend:

Docker

before

Command Line

---

# Competency Difficulty

Every competency has a level.

Possible values

BEGINNER

INTERMEDIATE

ADVANCED

EXPERT

---

Difficulty is used for:

recommendations

analytics

mentor matching

learning path generation

---

# Competency Status

A learner competency may be:

NOT_STARTED

IN_PROGRESS

UNDER_REVIEW

COMPETENT

MASTERED

---

Only assessments may change competency status.

Projects alone cannot.

---

# Learning Path Generation

Learning Paths are automatically generated.

Inputs:

Learning Area

Competencies

Competency Groups

Difficulty

Prerequisites

Mentor Availability

Expected Output

Ordered learning journey.

Example

Git

↓

GitHub

↓

REST APIs

↓

Authentication

↓

Testing

↓

Deployment

---

# Manual Overrides

Administrators may:

insert competencies

remove competencies

reorder competencies

disable competencies

replace competencies

---

Overrides affect only the selected learner.

The master curriculum remains unchanged.

---

# Mentor Relationship

Mentors are NOT assigned to Learning Areas alone.

Mentors are assigned to competencies.

Example

Mentor A

Software Engineering

Backend Development

REST APIs

Authentication

Testing

---

Mentor B

Software Engineering

Frontend Development

React

Next.js

Accessibility

---

This allows one learner to have multiple mentors in future versions.

Current version allocates one primary mentor.

---

# Competency Ownership

Each competency has:

Name

Description

Difficulty

Estimated Hours

Learning Resources

Projects

Assessments

Tags

Status

Version

Created Date

Updated Date

---

# Estimated Learning Hours

Every competency stores estimated effort.

Example

Git

8 hours

REST APIs

18 hours

Testing

20 hours

Docker

15 hours

---

Used for:

learning path estimation

analytics

progress forecasting

---

# Versioning

Curriculum evolves.

Changes must never break historical learner records.

Instead:

Version 1

↓

Version 2

↓

Version 3

Learners continue using the version they started unless migrated.

---

# Curriculum Import

Administrators may:

Import Template

Export Template

Duplicate Template

Archive Template

Restore Template

---

Supported formats:

JSON

CSV

Excel

---

# Curriculum Validation

The engine must prevent:

Duplicate Learning Areas

Duplicate Competencies

Circular prerequisites

Duplicate Competency Groups

Empty Learning Paths

Invalid difficulty levels

Broken references

---

# Search

Administrators must search by:

Learning Area

Competency

Difficulty

Group

Status

Keyword

---

# Filtering

Support filters:

Difficulty

Learning Area

Group

Archived

Active

Version

---

# Analytics

Curriculum Analytics include:

Most difficult competencies

Least completed competencies

Most mastered competencies

Average completion time

Learning Area popularity

Competency usage

Mentor coverage

---

# Security

Only Administrators may:

Create Learning Areas

Delete Learning Areas

Create Competencies

Delete Competencies

Manage Templates

Manage Curriculum

Mentors may only view curriculum.

Learners may only view assigned learning paths.

---

# Acceptance Criteria

The Curriculum Engine is complete when:

✓ Learning Areas exist.

✓ Competencies are reusable.

✓ Competency Groups organize competencies.

✓ Templates ship with the system.

✓ Learning Paths generate correctly.

✓ Prerequisites are respected.

✓ Difficulty levels exist.

✓ Curriculum versioning works.

✓ Analytics consume curriculum data.

✓ Mentorship depends on competencies rather than departments.

---

# Related Documents

02_DOMAIN_MODEL.md

05_MENTORSHIP_ENGINE.md

06_LEARNING_ENGINE.md

07_PROJECT_ENGINE.md

09_ASSESSMENT_ENGINE.md

11_ANALYTICS_ENGINE.md