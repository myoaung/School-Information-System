# Part 1.4 — Scope, Stakeholders, Personas, Constraints & Assumptions

---

# Project Scope

This section defines what is included and excluded in the AI-Enhanced School Management System.

---

## In Scope

The following modules and capabilities are included in this system:

### Core School Management

- Student Management System
- Teacher Management System
- Staff Management System
- Course & Curriculum Management
- Attendance Management
- Examination Management
- Timetable & Scheduling System
- Event Management System
- Notification System

---

### AI Capabilities

- Natural Language Query Interface
- AI Chatbot for Students, Parents, and Staff
- AI Report Generation
- Predictive Analytics (Student Risk, Dropout, Performance)
- AI Scheduling Optimization
- Curriculum Gap Analysis
- Lesson Plan Assistance
- AI-Based Recommendations

---

### AI Architecture Components

- LLM Integration (Claude / equivalent)
- RAG (Retrieval Augmented Generation)
- Vector Database
- Prompt Management System
- AI Orchestration Layer
- Agent-Based AI System
- MCP Integration Layer

---

### Reporting & Analytics

- Principal Dashboard
- Teacher Performance Dashboard
- Student Performance Analytics
- Attendance Analytics
- Predictive School Insights

---

### Security & Access Control

- Role-Based Access Control (RBAC)
- Authentication System (JWT/OAuth2)
- Audit Logging
- Data Encryption
- PII Protection Layer

---

## Out of Scope

The following items are NOT included in Phase 1 of the system:

- Full Learning Management System (LMS) with video hosting
- Live online classroom streaming
- Payment gateway / finance module
- Government national education integration APIs
- Biometric or face recognition attendance (future phase)
- Fully autonomous AI decision-making without human approval
- External public AI access (system is internal-use only)

---

# Stakeholders

This system involves multiple stakeholder groups with different needs and access levels.

---

## Stakeholder Matrix

| Stakeholder    | Role               | Key Needs                   | AI Interaction |
| -------------- | ------------------ | --------------------------- | -------------- |
| Principal      | Decision maker     | School performance insights | High           |
| Vice Principal | Operations manager | Scheduling, monitoring      | High           |
| Teachers       | Education delivery | Lesson support, reports     | Medium         |
| Students       | Learners           | Study assistance, feedback  | Medium         |
| Parents        | Guardians          | Progress tracking           | Medium         |
| Admin Staff    | Operations         | Data entry, scheduling      | Low            |
| IT Admin       | System maintenance | System monitoring           | Low            |
| Government     | Compliance         | Reports & analytics         | Low            |

---

# User Personas

---

## 1. Principal Persona

### Name: Dr. Aung (Example)

### Goals:

- Monitor school performance
- Improve academic results
- Optimize teacher workload

### Pain Points:

- Lack of real-time insights
- Manual report dependency
- Delayed decision-making

### AI Needs:

- Predictive dashboards
- Risk alerts
- Strategic recommendations

---

## 2. Teacher Persona

### Name: Ms. Hla Hla

### Goals:

- Teach effectively
- Reduce administrative workload
- Track student progress

### Pain Points:

- Time-consuming lesson planning
- Manual report writing
- Large class monitoring difficulty

### AI Needs:

- Lesson plan generator
- Student performance summaries
- Automated grading assistance

---

## 3. Student Persona

### Name: Min Min

### Goals:

- Improve grades
- Stay organized
- Get learning support

### Pain Points:

- Lack of personalized feedback
- Missed assignments
- Difficulty tracking progress

### AI Needs:

- Study recommendations
- Progress tracking
- AI tutor/chat assistant

---

## 4. Parent Persona

### Name: Mrs. Mary

### Goals:

- Monitor child progress
- Stay informed
- Support education

### Pain Points:

- Delayed updates
- Lack of clarity in reports
- Limited communication

### AI Needs:

- Real-time notifications
- AI-generated summaries
- Chat assistant for queries

---

## 5. Admin Staff Persona

### Name: Mr. John

### Goals:

- Maintain school data
- Manage scheduling
- Support operations

### Pain Points:

- Manual data entry
- Scheduling conflicts
- Repetitive tasks

### AI Needs:

- Auto-scheduling
- Data validation tools
- Workflow automation

---

# System Assumptions

The following assumptions are made for system design:

- Schools have digital access to basic infrastructure
- Internet connectivity is stable
- Staff will receive basic training for system usage
- Existing school data is available in digital or migratable format
- AI services (LLM APIs) are accessible via cloud
- Users will interact via web or mobile interface

---

# System Constraints

---

## Technical Constraints

- AI model latency must remain under 2 seconds for real-time queries
- System must support concurrent users (scalable architecture required)
- Must operate with role-based access control at all times
- Must ensure data privacy compliance

---

## Business Constraints

- Limited budget for initial deployment phase
- Gradual adoption required (cannot replace all systems at once)
- Staff training required before full AI adoption

---

## Data Constraints

- Incomplete historical student data may affect AI accuracy
- Data quality varies across schools
- Standardization required before AI training

---

# Dependencies

---

## External Dependencies

- LLM API Provider (Claude / OpenAI / equivalent)
- Cloud Infrastructure Provider (AWS / Azure / GCP)
- Vector Database (pgvector / Pinecone)
- Notification Services (Email/SMS/Push)

---

## Internal Dependencies

- Clean and structured school database
- Event-driven backend architecture
- API standardization across modules
- Authentication system (RBAC implemented)

---

# Risks & Mitigation (Foundational)

---

## Risk 1: Poor Data Quality

- **Impact:** Incorrect AI predictions
- **Mitigation:** Data validation pipeline + cleaning scripts

---

## Risk 2: AI Misinterpretation

- **Impact:** Wrong recommendations
- **Mitigation:** Human-in-the-loop approval system

---

## Risk 3: User Resistance

- **Impact:** Low adoption rate
- **Mitigation:** Training + gradual rollout

---

## Risk 4: System Complexity

- **Impact:** Difficult maintenance
- **Mitigation:** Modular microservices architecture

---

# System Boundaries

The AI system will operate within the following boundaries:

- AI assists but does not replace human decision-making
- Sensitive student decisions require human approval
- AI outputs are advisory, not authoritative
- System operates only within school-managed data scope

---

# Summary of Part 1

This completes the foundational layer of the AI-Enhanced School Management System proposal.

### Part 1 Delivered:

- ✔ Executive Summary
- ✔ Business Background
- ✔ Problem Analysis
- ✔ Objectives & KPIs
- ✔ Scope Definition
- ✔ Stakeholders
- ✔ User Personas
- ✔ Constraints & Assumptions

---

# Transition to Part 2

The next section will move into:

# Part 2 — Functional Requirements & Non-Functional Requirements

This will include:

- 100+ Functional Requirements (FRs)
- System behavior specifications
- AI functional requirements
- Detailed NFRs (performance, security, scalability, etc.)
- User stories
- Acceptance criteria

---

**End of Part 1.4**
