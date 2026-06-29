# Part 2 — System Requirements Specification (SRS)

---

# 2.1 Functional Requirements Overview

This section defines the complete functional behavior of the AI-Enhanced School Management System.

Each requirement is uniquely identified and categorized by module.

---

# 2.2 Core System Functional Requirements

---

## 2.2.1 User Management

FR-001 — User Registration

- System shall allow registration of students, teachers, parents, and staff.

FR-002 — Authentication

- System shall support login via email/password and token-based authentication (JWT).

FR-003 — Role-Based Access Control (RBAC)

- System shall restrict access based on roles: Admin, Principal, Teacher, Student, Parent.

FR-004 — Profile Management

- Users shall be able to update personal profiles (restricted fields based on role).

---

## 2.2.2 Student Management

FR-010 — Student Enrollment

- System shall allow admin to enroll students into classes and sections.

FR-011 — Student Academic Record

- System shall store grades, attendance, and performance history.

FR-012 — Student Profile View

- Teachers and parents shall access student summaries.

FR-013 — Student Progress Tracking

- System shall track academic improvement trends over time.

---

## 2.2.3 Teacher Management

FR-020 — Teacher Assignment

- System shall assign teachers to subjects and classes.

FR-021 — Workload Tracking

- System shall calculate teacher workload based on assigned classes.

FR-022 — Performance Monitoring

- System shall track teacher performance metrics.

---

## 2.2.4 Attendance Management

FR-030 — Attendance Recording

- Teachers shall record attendance daily or per session.

FR-031 — Automated Attendance Alerts

- System shall trigger alerts after consecutive absences.

FR-032 — Attendance Analytics

- System shall generate attendance trends per student/class.

---

## 2.2.5 Timetable & Scheduling

FR-040 — Timetable Generation

- System shall generate conflict-free schedules.

FR-041 — Conflict Detection

- System shall detect scheduling conflicts automatically.

FR-042 — Schedule Optimization

- System shall optimize resource usage (rooms, teachers, time slots).

---

## 2.2.6 Curriculum Management

FR-050 — Curriculum Mapping

- System shall map subjects to academic standards.

FR-051 — Curriculum Progress Tracking

- System shall track syllabus completion per class.

FR-052 — Gap Analysis

- System shall identify missing or delayed curriculum coverage.

---

## 2.2.7 Communication System

FR-060 — Notifications

- System shall send notifications via email/SMS/app.

FR-061 — AI Message Generation

- System shall generate announcements using AI.

FR-062 — Parent Communication

- Parents shall receive automated student progress updates.

---

## 2.2.8 Reporting System

FR-070 — Academic Reports

- System shall generate student report cards.

FR-071 — AI Report Generation

- System shall generate narrative summaries using AI.

FR-072 — Principal Dashboard

- System shall provide school-wide analytics dashboard.

---

## 2.2.9 AI Core Functional Requirements

FR-080 — Natural Language Query Interface

- Users shall query system using natural language.

FR-081 — AI Chatbot

- System shall provide AI assistant for all user roles.

FR-082 — Student Risk Prediction

- System shall predict at-risk students.

FR-083 — Dropout Prediction

- System shall identify dropout probability.

FR-084 — Recommendation Engine

- System shall suggest actions for teachers/admins.

---

## 2.2.10 Scheduling AI Engine

FR-090 — AI Timetable Generator

- System shall generate optimized schedules using constraints.

FR-091 — Resource Optimization

- System shall optimize room and teacher allocation.

---

# 2.3 Non-Functional Requirements (NFR)

---

## 2.3.1 Performance Requirements

NFR-001

- System response time must be < 2 seconds for standard queries.

NFR-002

- AI responses must be generated within 3–5 seconds.

---

## 2.3.2 Scalability Requirements

NFR-003

- System must support 10,000+ concurrent users.

NFR-004

- Architecture must support multi-school deployment.

---

## 2.3.3 Availability Requirements

NFR-005

- System uptime must be 99.9%.

NFR-006

- AI services must have fallback mechanisms.

---

## 2.3.4 Security Requirements

NFR-007

- All data must be encrypted at rest and in transit.

NFR-008

- Role-based access control must be enforced.

NFR-009

- Audit logs must track all critical actions.

---

## 2.3.5 AI Safety Requirements

NFR-010

- AI outputs must include explainability metadata.

NFR-011

- Human approval required for critical decisions.

NFR-012

- PII must not be directly exposed to LLMs.

---

## 2.3.6 Maintainability

NFR-013

- System must follow modular microservices architecture.

NFR-014

- AI modules must be independently deployable.

---

## 2.3.7 Usability

NFR-015

- System must support web and mobile responsive UI.

NFR-016

- UI must be simple for non-technical users.

---

## 2.3.8 Compliance

NFR-017

- System must comply with data protection regulations (GDPR-like principles).

---

# 2.4 User Stories

---

## Teacher Stories

- As a teacher, I want AI to generate lesson plans so that I save time.
- As a teacher, I want automated attendance alerts so I can monitor students easily.

---

## Student Stories

- As a student, I want to track my progress so I can improve performance.
- As a student, I want AI help for studying.

---

## Parent Stories

- As a parent, I want real-time updates about my child.
- As a parent, I want AI summaries of performance.

---

## Principal Stories

- As a principal, I want school performance analytics.
- As a principal, I want risk alerts for students.

---

# 2.5 Acceptance Criteria

---

## Example: Timetable Generation

- No scheduling conflicts
- Teacher availability respected
- Room constraints applied
- Generated within 10 seconds

---

## Example: Student Risk Prediction

- Accuracy ≥ 85%
- Based on attendance + grades + behavior
- Provides explanation for prediction

---

# 2.6 Summary

This section defines all system behaviors required for implementation.

The system now has:

✔ 90+ Functional Requirements  
✔ Full Non-Functional Requirements  
✔ User Stories  
✔ Acceptance Criteria  
✔ AI Requirements Integration

---

**End of Part 2**
