# 08. Logbook Engine

---

# Purpose

The Logbook Engine records, validates, reviews, and preserves the learner's day-to-day learning activities.

Unlike traditional internship logbooks that simply record attendance or daily notes, BGHub's Logbook Engine is competency-driven.

Every logbook entry contributes evidence towards competency development, project completion, mentor review, assessments, analytics, and portfolio generation.

The Logbook Engine acts as the permanent evidence repository for learner growth.

---

# Core Philosophy

A learner does not simply record what they did.

Every logbook entry should answer four questions:

- What competency was practiced?
- What project was worked on?
- What evidence supports the work?
- What feedback did the mentor provide?

The workflow is:

Learning Path

↓

Competency

↓

Project

↓

Daily Work

↓

Evidence

↓

Mentor Review

↓

Assessment

↓

Portfolio

---

# Daily Logbook Entries

Learners submit logbook entries daily.

Each entry represents work completed during a single learning session.

---

# Logbook Structure

Each logbook entry contains:

Date

Learning Path

Learning Area

Competency

Project

Milestone

Task

Title

Description

Hours Worked

Challenges Faced

Solutions Applied

Lessons Learned

Evidence

Mentor Feedback

Status

Created Date

Updated Date

---

# Learning Path

Every entry must belong to one active Learning Path.

The learner cannot create entries for archived or completed learning paths.

---

# Competency Mapping

Every entry must reference at least one competency.

Example

Learning Area

Software Engineering

Competency

REST APIs

Project

Hospital Management System

---

Entries without competencies are invalid.

---

# Project Mapping

Entries should normally belong to a project.

If no project exists, administrators may allow "Independent Practice" entries.

---

# Hours Worked

Every entry records learning effort.

Example

2 Hours

5 Hours

8 Hours

Hours contribute to:

Learning analytics

Progress estimation

Portfolio summaries

---

# Challenges Faced

Learners describe problems encountered.

Examples

Authentication errors

Database migration issues

Deployment failures

Git merge conflicts

This helps mentors understand learner struggles.

---

# Solutions Applied

Learners explain how challenges were solved.

This promotes reflective learning rather than activity reporting.

---

# Lessons Learned

Each entry records knowledge gained.

Example

"Learned how JWT authentication works."

---

# Evidence

Each logbook entry may contain multiple evidence items.

Supported evidence types:

GitHub Repository

Source Code

Screenshot

Image

PDF

Video

Presentation

Deployment Link

API Documentation

Research Notes

Other

---

# Evidence Metadata

Each evidence item stores:

Title

Type

Description

URL or File

Upload Date

Approval Status

Reviewer

---

# Entry Status

Each logbook entry has one status.

Possible values:

DRAFT

SUBMITTED

UNDER_REVIEW

APPROVED

REJECTED

ARCHIVED

---

# Draft Entries

Learners may save drafts.

Drafts are editable.

Mentors cannot review drafts.

---

# Submission

Submitted entries become read-only for learners until review.

---

# Mentor Review

Mentors review submitted entries.

Possible outcomes:

Approved

Revision Required

Rejected

Approved entries contribute to competency evidence.

Rejected entries remain visible but do not contribute to progress.

---

# Mentor Feedback

Mentors may provide:

General comments

Technical advice

Improvement suggestions

Commendations

Recommended resources

Feedback is permanently stored.

---

# Revision Requests

When revisions are requested:

Learner edits the existing entry.

The history is preserved.

The status returns to:

UNDER_REVIEW

---

# Entry History

Every modification is recorded.

History stores:

Previous Version

Modified By

Modified Date

Reason

This ensures auditability.

---

# Logbook Timeline

Learners can view entries chronologically.

Timeline includes:

Projects

Competencies

Reviews

Assessments

Milestones

Evidence

---

# Dashboard Integration

Learner dashboard displays:

Today's Entries

Pending Reviews

Approved Entries

Rejected Entries

Hours Logged

Competencies Practiced

Recent Feedback

---

Mentor dashboard displays:

Pending Reviews

Recent Submissions

Learner Activity

Average Review Time

Outstanding Entries

---

Admin dashboard displays:

Institution-wide submissions

Approval rate

Pending reviews

Average hours logged

Most active learners

---

# Analytics

The Logbook Engine provides:

Entries Submitted

Entries Approved

Entries Rejected

Average Hours Worked

Competency Activity

Project Activity

Daily Learning Trends

Mentor Review Speed

Evidence Submission Rate

Learning Consistency

---

# Portfolio Integration

Approved entries contribute to:

Project summaries

Competency evidence

Learning history

Portfolio achievements

Rejected entries never appear in the portfolio.

---

# Notifications

Notifications are generated for:

Entry Submitted

Review Requested

Entry Approved

Entry Rejected

Revision Requested

Feedback Added

---

# Validation Rules

The engine must prevent:

Future dates

Negative hours

Entries without competencies

Entries without learning paths

Entries after learning path completion

Duplicate entries for the same work

Evidence with unsupported formats

Editing approved entries

---

# Audit Trail

Every action is recorded.

Audit events include:

Draft Created

Submitted

Reviewed

Approved

Rejected

Edited

Archived

Evidence Added

Evidence Removed

---

# Security

Learners may:

Create drafts

Submit entries

Edit drafts

Respond to revision requests

View feedback

Mentors may:

Review entries

Approve

Reject

Request revisions

Leave feedback

Administrators may:

View all entries

Archive entries

Restore entries

Generate reports

Audit activity

---

# Acceptance Criteria

The Logbook Engine is complete when:

✓ Entries belong to Learning Paths.

✓ Entries reference competencies.

✓ Projects are linked.

✓ Evidence supports submissions.

✓ Draft workflow functions correctly.

✓ Mentor review workflow functions correctly.

✓ Revision workflow preserves history.

✓ Approved entries update analytics.

✓ Approved entries contribute to portfolios.

✓ Notifications trigger correctly.

✓ Audit history is maintained.

---

# Related Documents

06_LEARNING_ENGINE.md

07_PROJECT_ENGINE.md

09_ASSESSMENT_ENGINE.md

10_PORTFOLIO_ENGINE.md

11_ANALYTICS_ENGINE.md

12_NOTIFICATION_ENGINE.md