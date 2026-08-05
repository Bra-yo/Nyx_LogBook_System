# 06. Learning Engine

---

# Purpose

The Learning Engine is responsible for managing the complete learning journey of every learner.

It transforms the curriculum into a personalized, competency-driven learning experience by generating learning paths, tracking progress, recommending mentors, monitoring competency development, and preparing learners for projects and assessments.

The Learning Engine is the operational heart of BGHub.

---

# Core Philosophy

Learning in BGHub is competency-based.

Learners do not progress by completing subjects or courses.

Instead, they progress by demonstrating competency.

The learner journey is:

Learning Area

↓

Learning Path

↓

Competencies

↓

Projects

↓

Logbook

↓

Assessment

↓

Portfolio

↓

Career Readiness

---

# Learning Lifecycle

Every learner follows the same lifecycle.

1. Registration

↓

2. Payment Verification

↓

3. First Login

↓

4. Onboarding

↓

5. Learning Path Generation

↓

6. Mentor Recommendation

↓

7. Mentor Allocation

↓

8. Learning Begins

↓

9. Projects

↓

10. Logbooks

↓

11. Assessments

↓

12. Portfolio

↓

13. Graduation / Completion

---

# Registration

Administrators create learner accounts.

During registration:

Learning Area is assigned.

Admission Number is recorded.

Institution information is stored.

Payment Status defaults to Pending.

Learners cannot modify these values.

---

# Payment Verification

Learners cannot access the system until payment has been verified.

If payment is pending:

Display:

"Your account has not yet been activated.
Please complete payment or contact the administrator."

Never display:

"Invalid email or password."

---

# First Login

On first login the learner completes onboarding.

The learner provides:

Personal Profile

Phone Number

Biography

Career Interests

Preferred Communication

Emergency Contact

Profile Picture

The learner DOES NOT choose:

Learning Area

Competencies

Mentor

Learning Path

These are system-managed.

---

# Learning Area

Every learner belongs to exactly one Learning Area.

Example:

Software Engineering

Artificial Intelligence

Networking

Cyber Security

The assigned Learning Area is read-only.

Only administrators may change it.

---

# Learning Path Generation

Immediately after onboarding the Learning Engine generates a personalized Learning Path.

Generation considers:

Learning Area

Curriculum Template

Competency Prerequisites

Difficulty

Learning Order

Mentor Availability

The learner does not manually create a learning path.

---

# Learning Path Structure

A learning path contains:

Learning Area

↓

Competency Groups

↓

Competencies

↓

Estimated Duration

↓

Progress

↓

Status

---

# Competency Progress

Each competency has its own progress.

Possible states:

NOT_STARTED

IN_PROGRESS

UNDER_REVIEW

COMPETENT

MASTERED

Progress changes only after assessment.

Completing a project alone does not mark a competency as mastered.

---

# Learning Order

Competencies must follow prerequisite rules.

Example:

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

The system must prevent learners from skipping mandatory prerequisites unless an administrator overrides the path.

---

# Learning Recommendations

The engine continuously recommends the learner's next activity.

Examples:

Continue current competency

Review mentor feedback

Submit project

Complete logbook

Prepare assessment

Start next competency

Recommendations are recalculated whenever learner progress changes.

---

# Learning Status

Each learner has an overall learning status.

Possible values:

NOT_STARTED

ACTIVE

ON_HOLD

COMPLETED

ARCHIVED

---

# Estimated Progress

The Learning Engine calculates:

Completed Competencies

Remaining Competencies

Estimated Hours Remaining

Estimated Completion Date

Current Learning Velocity

Average Weekly Progress

---

# Learning Timeline

The learner timeline records:

Registration

Onboarding

Mentor Allocation

Learning Path Generation

Projects

Logbooks

Assessments

Portfolio Updates

Completion

The timeline is permanent.

---

# Mentor Integration

The Learning Engine does not assign mentors directly.

Instead it requests recommendations from the Mentorship Engine.

Administrators approve the final allocation.

---

# Project Integration

Projects are attached to competencies.

When a learner reaches a competency requiring practical work:

The project becomes available.

Projects reinforce competency development.

---

# Assessment Integration

Assessments occur after meaningful competency practice.

Assessment outcomes update competency status.

Possible outcomes:

Needs Improvement

Competent

Mastered

---

# Portfolio Integration

Portfolio entries are generated automatically from:

Completed Projects

Approved Assessments

Approved Evidence

Verified Skills

Learners never manually create competency achievements.

---

# Notifications

The Learning Engine triggers notifications for:

New Learning Path

Mentor Assigned

Project Available

Assessment Scheduled

Assessment Published

Portfolio Updated

Learning Completed

---

# Dashboard

The learner dashboard displays:

Learning Area

Assigned Mentor

Learning Path Progress

Current Competency

Next Competency

Projects

Pending Logbooks

Pending Assessments

Portfolio Progress

Notifications

Learning Analytics

---

# Analytics

The Learning Engine calculates:

Learning Completion %

Competencies Completed

Average Competency Time

Average Weekly Progress

Learning Velocity

Learning Streak

Estimated Graduation Date

Highest Competency Level

Lowest Performing Competencies

---

# Manual Overrides

Administrators may:

Pause Learning

Resume Learning

Replace Competencies

Insert Competencies

Skip Competencies

Restart Learning Path

Regenerate Learning Path

All overrides are recorded in the audit log.

---

# Validation Rules

The engine must prevent:

Duplicate Learning Paths

Multiple Active Learning Paths

Competencies outside the assigned Learning Area

Circular prerequisite chains

Missing mentor allocations

Invalid competency ordering

---

# Security

Learners may:

View Learning Path

View Progress

View Recommendations

Complete Projects

Submit Logbooks

View Assessments

Administrators may:

Modify Learning Paths

Regenerate Learning Paths

Override Competencies

Pause Learning

Resume Learning

Mentors may:

View Assigned Learners

Track Progress

Review Logbooks

Assess Competencies

---

# Acceptance Criteria

The Learning Engine is complete when:

✓ Learning Areas are administrator-assigned.

✓ Learners cannot modify Learning Areas.

✓ Learning Paths generate automatically.

✓ Competency prerequisites are respected.

✓ Progress updates correctly.

✓ Projects integrate into the learning path.

✓ Assessments determine competency completion.

✓ Portfolio updates automatically.

✓ Recommendations update dynamically.

✓ Learning analytics calculate correctly.

✓ All learning events appear in the learner timeline.

---

# Related Documents

04_CURRICULUM_ENGINE.md

05_MENTORSHIP_ENGINE.md

07_PROJECT_ENGINE.md

08_LOGBOOK_ENGINE.md

09_ASSESSMENT_ENGINE.md

10_PORTFOLIO_ENGINE.md

11_ANALYTICS_ENGINE.md