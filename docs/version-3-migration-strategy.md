# Version 3 Migration Strategy

## Purpose

This document is the implementation roadmap for evolving the current BGHUB platform from a worklog-oriented system into a competency-based mentorship management platform.

It is intentionally different from the architecture blueprint. This document answers:

- Which database tables must change first
- Which old tables remain temporarily for compatibility
- Which pages are replaced, extended, or kept as-is
- Which APIs remain active, which are extended, and which are deprecated
- How the migration avoids breaking current users and existing workflows

---

## Migration Principles

The migration must follow these rules:

1. No milestone begins until the previous milestone is complete, tested, and approved.
2. Existing users must not be forced into a hard break.
3. New capability must be added in an additive way whenever possible.
4. Old data remains readable even when the UI shifts to the new model.
5. Department-based assumptions remain temporarily available until the new architecture is fully adopted.
6. Branding must remain consistent as BGHUB throughout the migration.

---

## Phase 0 – Stabilisation (Baseline for Version 2.x)

This phase is not part of the new architecture, but it is essential. It creates a stable foundation before any major structural change.

### Objectives

- Fix priority bugs remaining in the current system
- Standardise branding to BGHUB everywhere
- Restore the engagement letter styling while preserving updated content
- Clean up the project creation flow by removing irrelevant fields such as company name
- Add missing delete cohort functionality
- Ensure the current admin, supervisor, lecturer, and student flows are reliable

### Outcome

A stable Version 2.x baseline that can safely absorb the Version 3 migration.

### Exit criteria

- No critical blocker bugs remain in the core workflows
- Core admin screens load reliably
- Existing user accounts can still log in and use the current application
- UAT confirms the platform is stable before architecture changes begin

---

## Phase 1 – Foundation (v3.1)

This is the first structural step toward the new model.

### Scope

Introduce the first set of core entities:

- Learning Areas
- Competencies
- Learning Area code generation
- Competency code generation
- Admin CRUD for learning areas and competencies
- Initial database relationships

### Database changes

#### Existing tables to preserve

- User
- Session
- Department
- Cohort
- StudentProfile
- SupervisorProfile
- LecturerProfile
- AdminProfile

#### Existing tables to extend

- LearningArea
  - Already present and should be treated as the first-class foundation table
- Competency
  - Already present and should be extended with future fields such as difficulty, estimated duration, and competency type

#### New tables to introduce

- CompetencyGroup
  - Represents a sub-group within a competency, for example: Frontend Beginner or AI Intermediate
- CompetencyGroupAssignment (optional at this stage, or implemented in Phase 2)
  - Temporary relation table if the system needs to link groups to learners or projects before the full assignment engine arrives

### UI and API changes

#### Existing pages to keep and extend

- Admin learning architecture page
- Admin cohorts page
- Existing admin dashboard area

#### New admin pages to add

- Learning area management page (if not already fully centralised)
- Competency management page
- Competency group management page (Phase 2)

#### APIs to keep

- Existing admin learning area APIs
- Existing admin competency APIs

#### New APIs to introduce

- /api/v3/learning-areas
- /api/v3/competencies
- /api/v3/competency-groups

### Exit criteria

- Learning areas and competencies can be created and edited by admins
- Codes are generated automatically
- Relationships are saved correctly
- Existing departments continue to work without breaking the new model

---

## Phase 2 – Competency Groups (v3.2)

This phase introduces the grouping model that makes the new architecture practical.

### Scope

Implement:

- Competency Group as a distinct module
- Group-to-competency relationship
- Group-based assignment preparation for later phases

### Database changes

#### New tables to introduce

- CompetencyGroup
  - Fields: id, name, code, competencyId, description, status, createdAt, updatedAt

#### Relationships

- One LearningArea has many Competencies
- One Competency has many CompetencyGroups
- One CompetencyGroup belongs to exactly one Competency

### Why this phase comes before projects

Projects depend on competencies and groups. Introducing competency groups first avoids redesigning projects twice.

### UI changes

- Add an admin page for competency groups
- Make it possible to view each competency with its groups
- Ensure groups can be used by future assignment flows

### API changes

- Add competency group CRUD endpoints
- Keep competency and learning area APIs active

### Exit criteria

- Admins can create and manage competency groups successfully
- Groups are linked to the correct competency
- The system is ready to support group-based assignment in later phases

---

## Phase 3 – Mentor Architecture (v3.3)

This phase transforms mentoring from a department-based model into a competency-based one.

### Scope

Replace the old department-based mentor model with a competency-based mentor assignment model.

### Database changes

#### Existing tables to preserve

- SupervisorProfile
  - This remains the mentor identity table and will be reinterpreted as the mentorship profile
- Department
  - Remains temporarily for compatibility but is no longer the primary placement model

#### New tables to introduce

- MentorCompetencyAssignment
  - Fields: id, mentorId, competencyId, learningAreaId, assignedAt, status, createdAt, updatedAt

#### Relationships

- One mentor can be assigned to many competencies
- One competency can be assigned to many mentors
- One mentor may also be assigned to one or more learning areas for broader coordination

### Business rule change

Mentors no longer teach broad departments. They teach specific competencies.

### UI changes

- Replace or extend mentor onboarding screens
- Admin selects learning area, then competencies, then sets mentor scope
- Mentors no longer select their own competencies

### API changes

#### Keep

- Existing supervisor profile APIs
- Existing cohort and learner APIs

#### Extend

- Mentor assignment APIs must be changed to work through competencies rather than departments

#### Deprecate

- Any workflow that assumes a mentor belongs to an entire department as the primary unit

### Exit criteria

- Admins can assign a mentor to competencies directly
- The system no longer depends on department-based mentor assignment as the primary model
- Existing users remain visible, but their mentor scope is now competency-based

---

## Phase 4 – Learner Architecture (v3.4)

This phase introduces the learner onboarding and competency-interest model.

### Scope

Implement the learner flow:

- Login
- Password reset
- Welcome wizard
- Select competencies
- Rank interest
- Dashboard arrival

### Database changes

#### Existing tables to extend

- StudentProfile
  - Add onboarding state, profile completion status, and preference handling

#### New tables to introduce

- LearnerCompetencyPreference
  - Fields: id, learnerId, competencyId, interestRank, createdAt, updatedAt

#### Relationships

- One learner can have many competency preferences
- One competency can be preferred by many learners

### UI changes

- Add a first-login onboarding wizard
- Replace a simplistic learner dashboard with a competency-aware dashboard

### API changes

#### Keep

- Existing student dashboard APIs
- Existing student profile APIs

#### Extend

- Student onboarding and dashboard APIs must understand competency preferences

### Exit criteria

- New learners complete onboarding successfully
- Learner competency interests are stored and can be used later by assignment and recommendation logic
- Existing learners are not broken by the new flow

---

## Phase 5 – Assignment Engine (v3.5)

This phase redesigns projects and assignments around the new competency architecture.

### Scope

Introduce the new assignment engine so that work can be targeted at:

- Individual learner
- Entire cohort
- Competency group
- Future: Learning Area

### Database changes

#### Existing tables to extend

- Project
  - Keep the table but reduce reliance on old fields that no longer fit the new model
  - The project form should shift away from company-name-centric language

#### Existing tables to preserve

- ProjectLearner
  - Continue as one assignment route for compatibility

#### New tables to introduce

- Assignment
  - Fields: id, projectId, targetType, targetId, assignedAt, createdAt, updatedAt
- AssignmentTargetType
  - Optional reference or enum used to define the target type

#### Relationships

- One Project has many Assignments
- One Assignment belongs to one target type and one target ID
- Target types include: LEARNER, COHORT, COMPETENCY_GROUP

### UI changes

- Reshape the project creation form around mentorship and competency delivery
- Remove irrelevant fields such as company name from the primary flow
- Make project assignment flexible and future-proof

### API changes

#### Keep

- Existing project APIs for backward compatibility

#### Extend

- Project creation and project detail APIs should support assignment targets

#### Deprecate

- Old project forms that assume a department-driven workflow

### Exit criteria

- A project can be assigned to a learner, cohort, or competency group
- Existing projects remain visible and usable
- The platform no longer depends on old project assignment patterns

---

## Phase 6 – Mentorship Sessions (v3.6)

This phase introduces the new core interaction layer for mentors and learners.

### Scope

Implement mentorship sessions with:

- Scheduling
- Attendance
- Notes
- Google Calendar integration
- Google Meet links
- Reminder generation
- Session history

### Database changes

#### New tables to introduce

- MentorshipSession
  - Fields: id, mentorId, competencyId, projectId, title, scheduledAt, durationMinutes, googleCalendarEventId, googleMeetLink, status, createdAt, updatedAt
- SessionAttendee
  - Fields: id, sessionId, learnerId, attendanceStatus, joinedAt, notes, createdAt, updatedAt
- SessionNote
  - Fields: id, sessionId, authorId, noteText, createdAt, updatedAt

#### Relationships

- One mentor has many mentorship sessions
- One mentorship session belongs to one competency
- One mentorship session may optionally belong to one project
- One mentorship session has many learners through SessionAttendee

### UI changes

- Add a mentorship session scheduling screen
- Add session history and notes
- Add attendance tracking to the session flow

### API changes

#### New APIs to introduce

- /api/v3/mentorship-sessions
- /api/v3/mentorship-sessions/[id]/attendance
- /api/v3/mentorship-sessions/[id]/notes

### Exit criteria

- Mentors can create and manage sessions inside BGHUB
- Attendance and notes are stored properly
- Sessions are tied to competency-based learning rather than disconnected calendar events

---

## Phase 7 – Competency Assessment (v3.7)

This phase introduces the formal competency assessment system.

### Scope

Implement the Dr. Kithuka-style 1–5 competency rating framework with evidence and commentary.

### Database changes

#### Existing tables to extend

- MilestoneMentorAssessment
  - This can be reinterpreted as a legacy assessment structure
- WeeklyMentorTaskReview
  - This remains useful as a compatibility structure but should not become the main assessment model

#### New tables to introduce

- CompetencyAssessment
  - Fields: id, learnerId, mentorId, competencyId, rating, evidenceType, evidenceUrl, comments, recommendations, nextAction, assessedAt, createdAt, updatedAt
- AssessmentEvidence
  - Fields: id, assessmentId, fileUrl, fileName, mimeType, storageProvider, createdAt, updatedAt

#### Relationships

- One competency assessment belongs to one learner
- One competency assessment belongs to one competency
- One competency assessment is written by one mentor
- Each assessment stores evidence and feedback
- Historical assessments are never overwritten

### Important rule

The system must preserve full assessment history. Previous ratings remain visible and are never replaced.

### UI changes

- Add a competency assessment screen
- Allow mentors to attach evidence and leave recommendations
- Display assessment history over time

### API changes

#### Keep

- Existing supervisor assessment APIs for legacy compatibility

#### Add

- New assessment endpoints for competency-based assessment

### Exit criteria

- Mentors can record ratings from 1 to 5 with evidence
- Assessments are stored historically
- The system can later produce progress graphs and competency growth views

---

## Phase 8 – Analytics and Dashboards (v3.8)

This phase transforms dashboards from static displays into decision-support tools.

### Scope

Redesign dashboards so they answer practical questions such as:

- Which learners require attention?
- Which competencies are improving?
- Which projects are overdue?
- Which mentors have pending reviews?
- Which sessions need follow-up?

### Database changes

No mandatory new tables are required at this point. The system should compute analytics from the new relational model.

### Recommended approach

- Build dashboards from the new core entities:
  - learning areas
  - competencies
  - competency groups
  - assignments
  - sessions
  - assessments
  - worklog submissions

### UI changes

- Replace dashboard cards with decision-oriented views
- Add mentor, learner, and admin dashboard modules aligned to the new model

### API changes

- Introduce analytics endpoints under v3 namespaces
- Keep legacy analytics endpoints for compatibility until the new dashboards are fully adopted

### Exit criteria

- Dashboards answer decision-making questions
- Users can act from the dashboard without manually searching through multiple screens
- The old dashboard style is no longer the primary experience

---

## Table-by-Table Migration Map

### Tables to preserve as-is

| Current table | Status | Migration action |
| --- | --- | --- |
| User | Preserve | Keep as the shared authentication and identity table |
| Session | Preserve | Keep as the auth session table |
| Notification | Preserve and extend | Extend with richer reference metadata for projects, sessions, assessments, and worklogs |
| AuditLog | Preserve | Keep for system-wide audit history |
| EmailDelivery | Preserve | Keep for delivery tracking |
| Attendance | Preserve and extend | Continue to support attendance while later linking it to mentorship sessions |
| OfficeLocation | Preserve | Continue to support physical attendance workflows |
| WorkerProfile | Preserve | Keep as an operational role, not part of the core mentorship architecture |
| Task | Preserve | Keep for operational work tracking if still needed |
| TaskWorkLog | Preserve | Keep as a lower-level worklog record |

### Tables to preserve but reinterpret

| Current table | Status | Migration action |
| --- | --- | --- |
| Department | Compatibility | Keep temporarily and do not remove until the new model is fully stable |
| Project | Extend | Rework around mentorship and competency assignments rather than departmental structure |
| ProjectLearner | Preserve | Continue as one assignment route, but treat it as one possible target type |
| Cohort | Preserve | Keep as learner grouping by intake or cohort identity |
| CohortMentorAssignment | Preserve | Keep for cohort-based mentor coordination while competency-based mentors are introduced |
| StudentProfile | Extend | Add onboarding and competency-interest fields |
| SupervisorProfile | Extend and reinterpret | Reframe as a mentor profile with competency assignment support |
| LecturerProfile | Preserve | Continue for academic oversight, not as a replacement for mentor architecture |
| AdminProfile | Preserve | Keep as system administration identity |
| LogbookEntry | Extend | Treat as evidence and worklog input, not as the main progress engine |
| SupervisorComment | Preserve and de-emphasise | Keep as a legacy review channel while the new assessment model becomes the default |
| LecturerAssessment | Preserve and extend | Keep for academic assessment compatibility |
| Milestone | Preserve temporarily | Use as a compatibility structure until the new competency-based model fully replaces it |
| MilestoneTask | Preserve temporarily | Keep as an older milestone workflow until new project and session flows mature |
| MilestoneMentorAssessment | Preserve temporarily | Keep as compatibility data while the new competency assessment model becomes primary |
| MilestoneLecturerAssessment | Preserve temporarily | Keep as compatibility data while academic assessments migrate |
| WeeklyMentorTaskReview | Preserve temporarily | Keep as history while the new assessment model becomes standard |

### Tables to add in the new model

| New table | Phase | Purpose |
| --- | --- | --- |
| CompetencyGroup | v3.2 | Group competencies into teachable units such as Beginner or Advanced |
| MentorCompetencyAssignment | v3.3 | Link mentors to competencies and learning areas |
| LearnerCompetencyPreference | v3.4 | Capture learner competency selection and ranking |
| Assignment | v3.5 | Represent project assignments to learners, cohorts, or competency groups |
| MentorshipSession | v3.6 | Store mentorship meeting metadata and scheduling information |
| SessionAttendee | v3.6 | Link learners to mentorship sessions |
| SessionNote | v3.6 | Store session follow-up notes |
| CompetencyAssessment | v3.7 | Store historical 1–5 competency ratings with comments and evidence |
| AssessmentEvidence | v3.7 | Store supporting files or links for each assessment |

---

## API Migration Strategy

### APIs to keep for compatibility

These should remain active during the migration:

- Admin learning area APIs
- Admin competency APIs
- Cohort APIs
- Project APIs
- Student dashboard APIs
- Supervisor review APIs
- Lecturer assessment APIs

### APIs to extend

These should be updated to support the new architecture:

- Supervisor profile and mentor APIs
- Project creation and project detail APIs
- Student onboarding and dashboard APIs
- Notification APIs
- Review and assessment APIs

### New API namespaces to introduce

Use new versioned endpoints for the new architecture:

- /api/v3/learning-areas
- /api/v3/competencies
- /api/v3/competency-groups
- /api/v3/assignments
- /api/v3/mentorship-sessions
- /api/v3/assessments
- /api/v3/analytics

### APIs to deprecate gradually

These should be deprecated only after the new equivalent exists and is tested:

- Department-based mentor assignment endpoints
- Legacy project assignment flows that assume old department logic
- Old review endpoints that are superseded by competency assessment flows

---

## Page Migration Strategy

### Pages to keep and extend

- Admin learning architecture page
- Admin cohorts page
- Student dashboard page
- Supervisor dashboard page
- Lecturer assessment page

### Pages to replace or reshape

- Project creation page
  - Must shift from a static, company-oriented flow to a mentorship-oriented assignment flow
- Supervisor mentor-management pages
  - Must shift from department-based logic to competency-based assignment logic
- Student onboarding experience
  - Must move to a guided competency selection and ranking flow
- Review and assessment pages
  - Must move toward historical competency assessment records

### New pages to add

- Competency group management page
- Mentorship session scheduling and history page
- Competency assessment page
- Competency growth dashboard

---

## Avoiding User Breakage

The migration must not force current users into a sudden change. The recommended approach is:

1. Keep the existing roles and authentication model intact.
2. Add new tables and APIs first.
3. Keep old screens and APIs live while new ones are introduced.
4. Use the new architecture behind the scenes first, then switch the UI gradually.
5. Preserve historical records so old workflows remain readable.
6. Only deprecate legacy pathways after the new ones are fully tested and approved.

### Recommended compatibility pattern

- Read old data through the old model where needed
- Write new data into the new model
- Maintain dual support during transition where necessary
- Make the new architecture the preferred path only after validation

---

## Recommended Implementation Order

The implementation order should be:

1. Phase 0 – Stabilisation
2. Phase 1 – Foundation
3. Phase 2 – Competency Groups
4. Phase 3 – Mentor Architecture
5. Phase 4 – Learner Architecture
6. Phase 5 – Assignment Engine
7. Phase 6 – Mentorship Sessions
8. Phase 7 – Competency Assessment
9. Phase 8 – Analytics and Dashboards

This order is intentional. Each phase depends on the one before it.

---

## Final Recommendation

The migration should be treated as a controlled evolution, not a wholesale rebuild. The strongest path is:

- preserve existing user and workflow continuity
- introduce the new competency model incrementally
- keep old tables available as compatibility layers until the new system is proven
- delay full replacement of projects and assessments until the competency and assignment foundations are in place

That approach gives BGHUB the best balance of stability, clarity, and long-term scalability.
