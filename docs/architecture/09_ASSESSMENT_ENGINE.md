# 09. Assessment Engine

---

# Purpose

The Assessment Engine evaluates learner competency acquisition through structured mentor and administrator assessments.

Unlike traditional examination systems that measure theoretical knowledge, BGHub assessments evaluate demonstrated competency using evidence collected throughout the learner's journey.

Assessments are competency-driven and evidence-based.

---

# Core Philosophy

Learners are not assessed because they completed a project.

Learners are assessed because they demonstrated competency.

Evidence comes from:

Learning Path

↓

Projects

↓

Logbook Entries

↓

Evidence Files

↓

Mentor Reviews

↓

Competency Assessment

↓

Portfolio

---

# Assessment Objectives

The Assessment Engine aims to:

- Validate competency acquisition.
- Measure learner progression.
- Provide constructive mentor feedback.
- Update competency status.
- Trigger portfolio updates.
- Supply analytics data.
- Maintain assessment history.

---

# Assessment Lifecycle

Every assessment follows this workflow:

Competency Ready

↓

Draft Assessment

↓

Review

↓

Final Assessment

↓

Competency Updated

↓

Portfolio Updated

↓

Analytics Updated

---

# Assessment Ownership

Assessments may be created by:

- Mentor
- Administrator

Learners cannot create assessments.

Learners can only view assessment results after publication.

---

# Assessment Scope

Each assessment belongs to:

One Learner

One Learning Path

One Competency

One Assessor

One Assessment Record

---

# Assessment Types

The system supports:

Competency Assessment

Project Assessment

Milestone Assessment

Final Competency Assessment

Reassessment

Future versions may introduce peer and external industry assessments.

---

# Assessment Record

Each assessment stores:

Assessment ID

Learner

Learning Area

Learning Path

Competency

Competency Group

Assessment Type

Current Competency Level

Previous Competency Level

Assessment Score

Mentor Comments

Strengths

Areas for Improvement

Recommendations

Evidence Reviewed

Assessor

Assessment Date

Submission Status

Published Date

Created Date

Updated Date

---

# Draft Assessments

Assessors may save assessments as drafts.

Draft assessments:

Remain editable

Do not affect learner progress

Do not appear on learner dashboards

Do not update analytics

---

# Final Assessments

Final assessments:

Become immutable

Update competency status

Trigger notifications

Update learner timeline

Update portfolio

Update analytics

Cannot be edited directly

---

# Editing Rules

Draft assessments:

✓ Editable

✓ Deletable

✓ Replaceable

Final assessments:

✗ Cannot be edited

✗ Cannot be deleted

Corrections require a new reassessment record.

---

# Reassessment

If competency requires another evaluation:

Create a new assessment.

Never overwrite previous assessments.

Assessment history is permanent.

---

# Competency Levels

Every assessment assigns one competency level.

Possible values:

BEGINNER

INTERMEDIATE

ADVANCED

EXPERT

MASTERED

Competency level is independent of assessment score.

---

# Assessment Status

Assessment records may be:

DRAFT

FINAL

ARCHIVED

---

# Assessment Outcomes

Possible competency outcomes:

Needs Improvement

Developing

Competent

Proficient

Mastered

Only FINAL assessments may update these outcomes.

---

# Assessment Evidence

Assessors review evidence such as:

Projects

Logbook Entries

GitHub Repository

Videos

Deployment Links

Screenshots

Source Code

Reports

Documentation

Evidence is never duplicated.

Assessments reference existing evidence.

---

# Mentor Feedback

Assessors provide:

Technical Feedback

Professional Feedback

Recommendations

Learning Resources

Next Competencies

Career Advice

Feedback becomes part of the learner's permanent history.

---

# Learner Timeline

Every published assessment appears in the learner timeline.

Timeline includes:

Assessment Date

Competency

Assessor

Level Awarded

Feedback Summary

---

# Competency Progress

Assessment outcomes automatically update:

Competency Status

Competency Level

Learning Progress

Learning Path Progress

Completion Percentage

---

# Learning Path Integration

When a competency is successfully assessed:

The learner progresses to the next competency in the learning path.

Prerequisites continue to be respected.

---

# Dashboard Integration

Learner Dashboard displays:

Recent Assessments

Current Competency Levels

Pending Assessments

Feedback

Progress

Mentor Dashboard displays:

Draft Assessments

Pending Reviews

Recently Published Assessments

Assessment Statistics

Administrator Dashboard displays:

Institution Assessment Metrics

Pending Assessments

Competency Completion

Assessment Trends

---

# Analytics

Assessment analytics include:

Average Scores

Competency Completion Rate

Competency Distribution

Assessment Volume

Assessment Turnaround Time

Mentor Assessment Activity

Most Challenging Competencies

Most Mastered Competencies

Learning Area Performance

---

# Notifications

Notifications are generated for:

Assessment Draft Saved

Assessment Submitted

Assessment Published

Competency Achieved

Reassessment Required

Feedback Available

---

# Validation Rules

The Assessment Engine must prevent:

Assessments without competencies

Assessments without assessors

Duplicate FINAL assessments for the same competency on the same date

Editing FINAL assessments

Deleting FINAL assessments

Publishing incomplete assessments

Assessment of archived learning paths

Assessment without evidence

---

# Audit Trail

Every assessment action is logged.

Audit events include:

Draft Created

Draft Updated

Draft Deleted

Assessment Finalized

Assessment Published

Assessment Archived

Reassessment Created

---

# Security

Learners may:

View published assessments

View feedback

Track competency progression

Mentors may:

Create draft assessments

Edit drafts

Publish assessments

Review learner evidence

Administrators may:

View all assessments

Create assessments

Override workflow when necessary

Archive assessments

Generate reports

---

# Acceptance Criteria

The Assessment Engine is complete when:

✓ Assessments belong to learning paths.

✓ Assessments belong to competencies.

✓ Draft workflow functions correctly.

✓ Final workflow functions correctly.

✓ Editing restrictions are enforced.

✓ Competency levels update automatically.

✓ Learner timelines update correctly.

✓ Portfolio updates automatically.

✓ Analytics consume assessment data.

✓ Notifications trigger correctly.

✓ Assessment history is preserved permanently.

---

# Related Documents

04_CURRICULUM_ENGINE.md

05_MENTORSHIP_ENGINE.md

06_LEARNING_ENGINE.md

07_PROJECT_ENGINE.md

08_LOGBOOK_ENGINE.md

10_PORTFOLIO_ENGINE.md

11_ANALYTICS_ENGINE.md

12_NOTIFICATION_ENGINE.md