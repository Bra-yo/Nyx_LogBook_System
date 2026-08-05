# BGHub Platform

Version: 1.0
Status: Official Architecture
Owner: BGHub Development Team

---

# Purpose

This document defines what BGHub is, why it exists, who uses it, and the philosophy behind every feature implemented within the system.

Every developer, designer, AI assistant, contributor, and stakeholder must understand this document before making architectural decisions.

If any implementation conflicts with this document, this document takes precedence.

---

# What is BGHub?

BGHub is an enterprise Competency-Based Learning, Internship, Mentorship and Portfolio Management Platform.

Unlike traditional internship logbook systems that only record attendance or daily activities, BGHub measures, develops, verifies and showcases learner competencies throughout the internship lifecycle.

The platform transforms internship management from a paperwork process into a measurable competency development journey.

---

# Vision

To become the most comprehensive competency-driven internship and mentorship platform for universities, TVET institutions, training organizations and industry partners.

---

# Mission

To simplify internship management while ensuring every learner graduates with:

- verified competencies
- measurable skills
- professional evidence
- industry mentorship
- an automatically generated digital portfolio

---

# Core Philosophy

BGHub is NOT a document management system.

BGHub is NOT a traditional internship logbook.

BGHub is a competency development platform.

Everything inside BGHub exists to answer one question:

> "What competencies has this learner demonstrated, and how confidently can the institution verify them?"

Everything else exists to support answering that question.

---

# Primary Objectives

The platform should:

- Reduce manual internship administration.
- Automate learner allocation.
- Improve mentor oversight.
- Measure competency growth.
- Track project participation.
- Collect practical evidence.
- Produce professional learner portfolios.
- Generate actionable analytics.

---

# Core Actors

BGHub currently supports three primary user roles.

## Administrator

Responsible for configuring and managing the entire learning ecosystem.

Responsibilities include:

- Managing users
- Managing Learning Areas
- Managing Competencies
- Managing Competency Groups
- Managing Learning Paths
- Assigning learners
- Assigning mentors
- Managing cohorts
- Reviewing analytics
- Monitoring system performance

Administrators are the owners of the learning architecture.

---

## Learner

The learner is the primary beneficiary of the system.

The learner does NOT configure the learning architecture.

The learner participates in it.

Responsibilities include:

- Completing onboarding
- Completing assigned learning paths
- Working on projects
- Maintaining a logbook
- Uploading evidence
- Receiving assessments
- Viewing competency growth
- Building a portfolio

---

## Mentor

Mentors guide learners through competency development.

Responsibilities include:

- Supervising learners
- Reviewing logbooks
- Reviewing evidence
- Providing competency assessments
- Giving feedback
- Monitoring learner progress
- Approving milestones

Mentors evaluate competency growth rather than academic grades.

---

# Future Roles

The platform has been designed for future expansion.

Future supported roles include:

- Lecturer
- Employer
- Industry Partner
- External Assessor
- Alumni
- Guest Reviewer

The architecture should remain flexible enough to incorporate these roles without major redesign.

---

# Core Business Concept

BGHub revolves around competencies.

The hierarchy is:

Learning Area

↓

Competency

↓

Competency Group

↓

Learning Path

↓

Project

↓

Milestone

↓

Task

↓

Logbook Entry

↓

Evidence

↓

Competency Assessment

↓

Portfolio

Every feature within the platform must map somewhere into this hierarchy.

If a proposed feature cannot be positioned within this structure, its necessity should be questioned before implementation.

---

# Learning Areas Replace Departments

BGHub intentionally does not use traditional university departments.

Instead, the system uses Learning Areas.

Examples include:

- Software Engineering
- Data Science
- Cyber Security
- Networking
- Artificial Intelligence
- UI/UX Design
- Cloud Computing
- Information Systems
- Multimedia
- Digital Marketing

A Learning Area functions as the highest organizational level within the competency framework.

Every learner belongs to exactly one Learning Area.

Every mentor belongs to one primary Learning Area but may possess competencies that span multiple areas.

---

# Competencies Are the Core Currency

Competencies represent measurable professional abilities.

Examples include:

Software Engineering

- REST API Development
- Authentication
- Database Design
- Testing

Networking

- Routing
- Switching
- VLAN Configuration
- Network Security

Cyber Security

- Penetration Testing
- Risk Assessment
- Incident Response

Artificial Intelligence

- Machine Learning
- Data Preparation
- Model Evaluation

Competencies are measurable.

They can improve over time.

They can be assessed repeatedly.

They form the basis of learner growth.

---

# Learning Paths

Learning Paths represent structured competency journeys.

A Learning Path is generated after administrator assignment and guides the learner through:

- competencies
- projects
- milestones
- assessments

Learning Paths define what the learner is expected to achieve.

---

# Projects

Projects provide practical opportunities for learners to demonstrate competencies.

Projects are linked to one or more competencies.

Project completion contributes toward competency progression.

---

# Logbooks

Logbooks capture day-to-day practical work.

Every logbook entry should be linked to:

- project
- learning path
- competencies
- evidence

Logbooks are evidence—not assessments.

---

# Evidence

Evidence validates learner claims.

Examples include:

- Documents
- Source Code
- Images
- Videos
- PDFs
- GitHub repositories
- Live deployments

Evidence supports competency assessment.

---

# Assessments

Competency assessments are conducted by mentors (and administrators where appropriate).

Assessments determine:

- competency level
- progress
- strengths
- improvement areas
- recommendations

Assessments never exist independently of competencies.

---

# Portfolio

The portfolio is automatically generated.

Learners should never manually build portfolios.

The system continuously aggregates:

- competencies
- projects
- achievements
- assessments
- verified evidence
- certificates

into a professional portfolio.

---

# Analytics

Analytics provide insight into:

- learner progress
- mentor workload
- competency growth
- project completion
- assessment trends
- institutional performance

Analytics are descriptive, predictive, and operational.

---

# Guiding Principle

Whenever uncertainty arises during development, the following priority order must be used:

1. Competency Development
2. Learner Experience
3. Mentor Efficiency
4. Administrative Simplicity
5. Institutional Analytics

Any implementation that increases complexity without improving these priorities should be reconsidered.

---

# Summary

BGHub is not merely an internship management system.

It is a competency-centered digital ecosystem designed to connect learning, mentorship, assessment, evidence collection, project execution, and professional portfolio development into a single unified platform.

Every module in BGHub exists to support competency growth and verified learner success.