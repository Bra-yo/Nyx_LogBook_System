# BGHub User Workflows

Version: 1.0

Status: Official Workflow Specification

---

# Purpose

This document defines the complete workflow for every user role inside BGHub.

It is the authoritative reference for:

- Navigation
- Permissions
- User journeys
- Business processes
- Dashboard behavior
- Feature visibility

Any implementation that contradicts these workflows is considered incorrect.

---

# System Roles

BGHub has only three operational roles.

1. Administrator
2. Mentor
3. Learner

Each role has a unique workflow.

---

# Administrator Workflow

The Administrator owns the platform.

Nothing enters the learning ecosystem without administrator approval or configuration.

---

## Administrator Dashboard

Immediately after login the administrator should see:

Institution Summary

including:

• Total Learners

• Total Mentors

• Active Learning Areas

• Active Competencies

• Active Projects

• Active Learning Paths

• Pending Mentor Recommendations

• Pending Assessments

• Pending Reviews

• Notifications

• Recent Activity

No unrelated statistics should appear.

No fake cards should exist.

---

# Administrator Responsibilities

Administrators perform all institutional configuration.

They can:

Manage Users

Manage Learning Areas

Manage Competencies

Manage Competency Groups

Manage Learning Paths

Manage Mentor Expertise

Manage Mentor Capacity

Allocate Mentors

Create Projects

Review Recommendations

Manage Templates

View Analytics

Generate Reports

Configure Notifications

Manage Settings

---

# Learner Registration Workflow

Administrator creates learner.

↓

Administrator selects:

Learning Area

↓

System automatically suggests default competencies.

↓

Administrator reviews suggestions.

↓

Administrator confirms.

↓

System generates Learning Paths.

↓

System stores learner profile.

↓

Learner receives account.

Learner never selects Learning Area.

---

# Mentor Registration Workflow

Administrator creates mentor.

↓

Administrator configures:

Learning Areas

Competencies

Competency Groups

Maximum Capacity

Availability

↓

Mentor account created.

↓

Mentor logs in.

↓

Mentor completes only personal profile.

Mentor never chooses expertise during onboarding.

---

# Mentor Recommendation Workflow

Learning Path created.

↓

Recommendation Engine runs.

↓

Eligible mentors filtered by:

Learning Area

Competencies

Capacity

Availability

↓

Recommendations ranked.

↓

Administrator reviews.

↓

Administrator may

Approve

Reject

Override

↓

Allocation created.

---

# Project Workflow

Administrator creates project.

↓

Select Learning Area

↓

Select Competency Groups

↓

Create Milestones

↓

Create Tasks

↓

Publish Project

↓

Learners receive assignment.

---

# Assessment Workflow

Learner completes work.

↓

Mentor reviews evidence.

↓

Mentor creates assessment.

↓

Draft

↓

Review

↓

Final Submission

↓

Progress updated

↓

Portfolio updated

↓

Analytics updated

---

# Portfolio Workflow

Learner completes projects.

↓

Evidence collected.

↓

Assessments completed.

↓

Competencies achieved.

↓

Portfolio generated automatically.

No manual editing.

---

# Learner Workflow

The learner consumes the learning experience.

Never configures it.

---

# Learner First Login

Login

↓

Payment Verified

↓

Complete Profile

↓

View Assigned Learning Area

↓

View Assigned Mentor

↓

View Learning Paths

↓

Dashboard

Learner never selects Learning Area.

Learner never selects Competencies.

Learner never selects Mentor.

---

# Learner Dashboard

Dashboard should immediately answer:

Who is my mentor?

What competency am I learning?

What project am I working on?

What should I do today?

Progress should display:

Current Learning Area

Competencies

Learning Paths

Projects

Upcoming Deadlines

Recent Feedback

Assessment Progress

Notifications

Portfolio Progress

---

# Learner Daily Workflow

Login

↓

Open Dashboard

↓

Continue Project

↓

Submit Logbook

↓

Attach Evidence

↓

Submit

↓

Receive Feedback

↓

Continue Learning

---

# Learner Logbook Workflow

Open Project.

↓

Choose Learning Path.

↓

Describe work completed.

↓

Enter hours.

↓

Attach evidence.

↓

Submit.

↓

Mentor reviews.

↓

Status updated.

---

# Learner Assessment Workflow

Learner cannot create assessments.

Learner may:

View assessments.

Read mentor comments.

Track competency progress.

See assessment history.

---

# Learner Portfolio Workflow

Portfolio updates automatically.

Learner may:

View portfolio.

Share portfolio.

Download portfolio.

Export portfolio.

Learner cannot manually edit achievements.

---

# Mentor Workflow

Mentors guide learners.

They do not administer the institution.

---

# Mentor Dashboard

Dashboard immediately displays:

Assigned Learners

Pending Reviews

Pending Assessments

Upcoming Meetings

Notifications

Capacity Summary

Recent Activity

Assigned learners should be displayed in searchable tables.

Not cards.

---

# Mentor Daily Workflow

Login

↓

View assigned learners.

↓

Open learner.

↓

Review submissions.

↓

Assess competency.

↓

Provide feedback.

↓

Monitor progress.

---

# Mentor Review Workflow

Learner submits work.

↓

Mentor reviews evidence.

↓

Approve

or

Request Changes

↓

Learner notified.

---

# Mentor Assessment Workflow

Open learner.

↓

Select competency.

↓

Review evidence.

↓

Create draft assessment.

↓

Edit draft if necessary.

↓

Finalize assessment.

↓

Competency updated.

---

# Mentor Capacity Workflow

Administrator sets:

Maximum Capacity

↓

System tracks:

Current Capacity

↓

Available Capacity

↓

Recommendation engine respects capacity.

Mentors cannot edit capacity.

---

# Notifications

Administrator receives:

Pending approvals

Pending recommendations

Reports

Mentor receives:

New learner

New submission

Assessment reminders

Learner receives:

Feedback

Assessment

Project assignment

Deadlines

Notifications should never show errors.

---

# Payment Workflow

Learner logs in.

↓

System checks payment.

↓

If unpaid:

Display

"Your account has not yet been activated.

Please complete payment or contact administration."

Never display:

Invalid email or password.

---

# Permission Matrix

Administrator

✔ Everything

Mentor

✔ Assigned learners only

Learner

✔ Own records only

---

# Forbidden Workflows

Learner selects Learning Area

❌ Forbidden

---

Learner selects Competencies

❌ Forbidden

---

Mentor configures expertise

❌ Forbidden

---

Mentor changes capacity

❌ Forbidden

---

Learner creates assessments

❌ Forbidden

---

Mentor edits Learning Areas

❌ Forbidden

---

Administrator performs learner logbooks

❌ Forbidden

---

Portfolio manual editing

❌ Forbidden

---

# Dashboard Principles

Dashboards should answer questions.

Administrator:

How is the institution performing?

Mentor:

Who needs my attention?

Learner:

What should I work on today?

Anything not helping answer those questions should be removed.

---

# Summary

The BGHub workflow is intentionally simple.

Administrators configure the ecosystem.

Mentors guide learners.

Learners develop competencies.

Every action contributes to competency development.

No workflow should bypass these responsibilities.