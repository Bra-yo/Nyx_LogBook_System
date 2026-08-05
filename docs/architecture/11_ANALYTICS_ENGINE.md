# 11. Analytics Engine

---

# Purpose

The Analytics Engine transforms raw operational data into meaningful insights for learners, mentors, administrators, finance teams, institutions, and future employers.

Rather than simply displaying counts, the Analytics Engine continuously measures progress, engagement, competency growth, mentorship effectiveness, project completion, assessment trends, and overall internship performance.

Analytics are generated automatically from verified system data.

No analytics should rely on manually entered values.

---

# Guiding Principles

The Analytics Engine must:

- Use verified data only.
- Update automatically.
- Be role-aware.
- Support historical comparisons.
- Support institutional reporting.
- Never expose unauthorized data.
- Be scalable.

---

# Data Sources

Analytics are generated from:

- Student Profiles
- Mentor Profiles
- Learning Areas
- Competencies
- Competency Groups
- Learning Paths
- Mentor Allocations
- Projects
- Milestones
- Tasks
- Logbook Entries
- Competency Assessments
- Supervisor Reviews
- Portfolio Records
- Notifications
- Attendance
- Payments

---

# Role-Based Analytics

Different users see different analytics.

The Analytics Engine must always respect permissions.

---

# Learner Analytics

Learners view personal progress only.

## Dashboard Metrics

Display:

Current Learning Area

Current Mentor

Learning Paths

Competencies Completed

Competencies Remaining

Projects Completed

Projects Active

Milestones Completed

Milestones Remaining

Tasks Completed

Pending Tasks

Logbook Entries Submitted

Pending Reviews

Approved Reviews

Assessment Average

Portfolio Completion

Attendance Rate

Internship Progress

Learning Progress

Skill Growth

Hours Logged

Weekly Activity

Monthly Activity

---

## Competency Progress

Every competency should display:

Current Level

Previous Level

Highest Level

Assessment Trend

Last Assessment Date

Completion Status

Mentor Feedback

---

## Learning Progress

Show:

Learning Area

↓

Competency Groups

↓

Competencies

↓

Current Status

↓

Completion %

---

## Project Analytics

Display:

Projects Assigned

Projects Active

Projects Completed

Average Completion Time

Project Success Rate

Milestone Completion

Task Completion

---

## Logbook Analytics

Display:

Entries This Week

Entries This Month

Total Entries

Average Hours

Pending Reviews

Approved Reviews

Revision Requests

---

## Assessment Analytics

Display:

Assessment Count

Latest Assessment

Competency Growth

Average Level

Highest Competency

Lowest Competency

Improvement Trend

---

## Portfolio Analytics

Display:

Portfolio Completion

Projects Included

Competencies Included

Evidence Count

Certificates Earned

Portfolio Visibility

---

# Mentor Analytics

Mentors see only assigned learners.

---

## Mentor Dashboard

Display:

Assigned Learners

Active Learners

Maximum Capacity

Capacity Utilization

Learning Areas Covered

Competencies Supervised

Projects Supervising

Pending Reviews

Pending Assessments

Completed Assessments

Average Learner Progress

Average Competency Growth

Average Logbook Approval Time

---

## Learner Summary

For every learner display:

Name

Learning Area

Current Competency

Progress

Last Activity

Portfolio Status

Assessment Status

Risk Level

---

## Workload Metrics

Display:

Current Capacity

Remaining Capacity

Average Reviews Per Week

Average Assessments Per Month

Pending Actions

Completed Actions

---

## Performance Metrics

Display:

Average Response Time

Assessment Completion Rate

Review Completion Rate

Learner Satisfaction (Future)

Completion Rate

Average Competency Improvement

---

# Administrator Analytics

Administrators see institution-wide analytics.

---

## Institution Dashboard

Display:

Total Learners

Active Learners

Inactive Learners

Graduated Learners

Total Mentors

Active Mentors

Learning Areas

Competencies

Competency Groups

Projects

Logbook Entries

Assessments

Certificates

Notifications

---

## Learning Area Analytics

For each Learning Area display:

Learners

Mentors

Competencies

Average Progress

Completion Rate

Average Assessment

Portfolio Completion

---

## Competency Analytics

Display:

Most Completed Competencies

Least Completed Competencies

Average Level

Average Completion Time

Assessment Distribution

---

## Mentor Analytics

Display:

Mentor Capacity

Utilization

Assessment Count

Learners Managed

Average Performance

Completion Rate

---

## Project Analytics

Display:

Projects Active

Projects Completed

Projects Delayed

Milestones Completed

Tasks Completed

Project Success Rate

---

## Assessment Analytics

Display:

Assessments This Week

Assessments This Month

Assessment Distribution

Average Scores

Competency Trends

Mentor Activity

---

## Logbook Analytics

Display:

Entries Submitted

Entries Approved

Entries Pending

Entries Rejected

Average Approval Time

Average Submission Rate

---

## Portfolio Analytics

Display:

Completed Portfolios

Incomplete Portfolios

Certificates Issued

Evidence Uploaded

Public Portfolios

---

# Finance Analytics

Display:

Payments Received

Pending Payments

Failed Payments

Revenue

Outstanding Balance

Student Payment Status

Monthly Revenue

Yearly Revenue

---

# Reports

The Analytics Engine must support downloadable reports.

Supported formats:

PDF

Excel

CSV

Print

---

Reports include:

Institution Summary

Mentor Performance

Learner Progress

Competency Completion

Project Summary

Assessment Report

Portfolio Report

Attendance Report

Payment Report

---

# Trend Analysis

Analytics should support trends.

Examples:

Weekly

Monthly

Semester

Annual

Custom Date Range

---

# Charts

Supported visualizations:

Line Charts

Bar Charts

Pie Charts

Area Charts

Heat Maps

Progress Rings

Growth Curves

Timeline Charts

Stacked Bars

---

# Dashboard Widgets

Widgets include:

Progress Cards

KPI Cards

Charts

Recent Activity

Alerts

Recommendations

Leaderboards

Upcoming Deadlines

---

# AI Insights (Future)

Future versions may include:

Learner Risk Prediction

Mentor Workload Optimization

Competency Recommendations

Career Suggestions

Project Recommendations

Learning Gap Detection

Portfolio Improvement Suggestions

---

# Refresh Strategy

Analytics should refresh automatically.

Recommended intervals:

Dashboard → Every login

Critical metrics → Real-time

Reports → On demand

Charts → Cached where appropriate

---

# Permissions

Learners

✓ Personal analytics only

---

Mentors

✓ Assigned learners only

---

Administrators

✓ Institution-wide analytics

---

Finance

✓ Financial analytics only

---

# Performance Rules

Analytics must:

Avoid expensive repeated queries.

Use aggregation where possible.

Support caching.

Support pagination.

Remain responsive for large institutions.

---

# Future Enhancements

Predictive Analytics

AI Mentor Insights

Machine Learning Recommendations

Institution Benchmarks

National Benchmarks

Cross-Institution Analytics

Employer Analytics Portal

Custom Dashboard Builder

Real-Time Event Streaming

---

# Related Documents

06_LEARNING_ENGINE.md

07_PROJECT_ENGINE.md

08_LOGBOOK_ENGINE.md

09_ASSESSMENT_ENGINE.md

10_PORTFOLIO_ENGINE.md

12_NOTIFICATION_ENGINE.md

19_TESTING_AND_ACCEPTANCE.md