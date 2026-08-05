# 05. Mentorship Engine

---

# Purpose

The Mentorship Engine is responsible for intelligently connecting learners with the most suitable mentors based on competency expertise, mentor availability, workload, and learner learning paths.

Unlike traditional supervision systems where a learner is assigned to a department or a random supervisor, BGHub performs competency-driven mentor allocation.

The Mentorship Engine is one of the core intelligence modules of the platform.

---

# Core Philosophy

Mentors do NOT own:

- Departments
- Courses
- Subjects
- Faculties

Mentors own competencies.

Everything revolves around competency expertise.

Example:

Software Engineering

↓

Backend Development

↓

REST APIs

↓

Authentication

↓

Testing

↓

Deployment

A mentor can specialize in any combination of these competencies.

---

# Mentor Profile

Each mentor profile stores:

Personal Information

Professional Information

Learning Area

Competency Expertise

Competency Groups

Years of Experience

Industry

Organization

Maximum Active Learners

Current Active Learners

Availability Status

Account Status

---

# Learning Area Assignment

Every mentor belongs to one primary Learning Area.

Example

Software Engineering

Artificial Intelligence

Networking

Cyber Security

Cloud Computing

Future versions may support multiple learning areas.

Current release supports one primary learning area.

---

# Competency Assignment

Administrators assign competencies.

Mentors NEVER choose their own competencies.

Example

Mentor Jane

Learning Area:

Software Engineering

Competencies

✓ Git

✓ GitHub

✓ REST APIs

✓ Authentication

✓ Docker

✓ Testing

✓ Deployment

---

# Competency Groups

Administrators also assign Competency Groups.

Example

Backend Development

Testing

Deployment

This allows the recommendation engine to quickly identify mentor specialization.

---

# Mentor Capacity

Every mentor has a configurable maximum learner capacity.

Example

Maximum Active Learners

15

Current Active Learners

12

Remaining Capacity

3

The capacity is configurable by administrators.

---

# Accepting New Learners

Each mentor has an availability switch.

Possible values:

Accepting New Learners

Not Accepting New Learners

If disabled, the mentor is excluded from automatic allocation.

---

# Allocation Principles

Mentor allocation follows these priorities.

1. Matching Learning Area

2. Matching Competency

3. Matching Competency Group

4. Mentor Availability

5. Remaining Capacity

6. Lowest Current Workload

7. Earliest Registration (tie breaker)

---

# Recommendation Engine

When a learner completes onboarding, the system automatically recommends mentors.

The recommendation engine does NOT allocate immediately.

Instead it generates ranked recommendations.

Example

1

Jane Doe

Backend Development

95%

2

John Smith

Backend Development

90%

3

Grace Njeri

Backend Development

86%

---

# Recommendation Factors

Recommendations consider:

Learning Area

Competencies

Competency Groups

Mentor Expertise

Current Capacity

Accepting Learners

Current Workload

Past Allocation History

---

# Manual Override

Administrators may ignore recommendations.

They can:

Assign another mentor

Replace recommendations

Create manual allocations

Force allocations

The system always allows administrator override.

---

# Learner Allocation

Current Version

Each learner has one primary mentor.

Future Version

Multiple mentors may supervise different competencies.

Example

Backend Mentor

Frontend Mentor

DevOps Mentor

AI Mentor

---

# Allocation Status

Possible statuses:

PENDING

ACTIVE

COMPLETED

ENDED

CANCELLED

---

# Allocation History

All mentor assignments are preserved.

The system never deletes allocation history.

History stores:

Allocated By

Allocated Date

Reason

Ended Date

End Reason

Replacement Mentor

---

# Capacity Calculation

Current Capacity

=

Maximum Capacity

−

Active Learners

Example

Maximum

20

Current

17

Available

3

When available capacity reaches zero:

The mentor becomes unavailable for automatic allocation.

---

# Mentor Dashboard

The mentor dashboard displays:

Active Learners

Pending Reviews

Projects

Pending Assessments

Competencies

Current Capacity

Average Progress

Notifications

---

# Learner View

Learners can view:

Assigned Mentor

Mentor Contact Information

Allocated Competencies

Current Learning Path

Mentor Feedback

Assessment History

Learners cannot change mentors.

---

# Expertise Changes

Administrators may update mentor expertise.

Changes affect future recommendations only.

Existing learner allocations remain unchanged unless reassigned.

---

# Automatic Reallocation

Automatic reallocation is triggered when:

Mentor leaves organization

Mentor disables availability

Administrator retires mentor

Capacity permanently reduced

Learning Area changes

---

# Reallocation Rules

The recommendation engine runs again.

Existing learner records remain intact.

History is preserved.

Notifications are sent.

---

# Notifications

Mentor receives:

New Learner Assigned

Assessment Pending

Project Assigned

Logbook Waiting

Learner receives:

Mentor Assigned

Mentor Changed

Assessment Published

Feedback Available

---

# Analytics

The Mentorship Engine provides:

Average Mentor Workload

Capacity Utilization

Allocation Trends

Most Requested Competencies

Average Learner Progress

Average Assessment Score

Mentor Performance

Learner Completion Rate

---

# Security

Only Administrators may:

Assign mentors

Modify competencies

Modify capacities

Change expertise

Create allocations

Mentors may:

View assigned learners

Assess competencies

Review logbooks

Create projects

Learners may:

View assigned mentor

Receive mentor feedback

View assessment history

---

# Acceptance Criteria

The Mentorship Engine is complete when:

✓ Mentors belong to one Learning Area.

✓ Administrators assign competencies.

✓ Administrators assign competency groups.

✓ Maximum capacity is configurable.

✓ Accepting New Learners toggle exists.

✓ Recommendation engine generates ranked mentors.

✓ Administrators can override recommendations.

✓ Allocation history is preserved.

✓ Capacity recalculates automatically.

✓ Dashboard metrics update correctly.

✓ Notifications are generated.

✓ Mentor expertise drives allocation.

---

# Related Documents

04_CURRICULUM_ENGINE.md

06_LEARNING_ENGINE.md

07_PROJECT_ENGINE.md

08_LOGBOOK_ENGINE.md

09_ASSESSMENT_ENGINE.md

11_ANALYTICS_ENGINE.md