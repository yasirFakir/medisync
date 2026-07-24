# Phase 05
# System Architecture & Technology Stack

---

# 5. System Architecture

## 5.1 Architectural Overview

MediSync shall be developed using a modular service-oriented architecture that separates presentation, business logic, artificial intelligence, data management, and background processing into independent components.

The system shall prioritize:

- Scalability
- Maintainability
- Modularity
- Security
- Cost Efficiency
- Future Extensibility

The initial release (MVP) shall focus on the Web Application while maintaining an architecture that can support future mobile applications without significant backend modifications.

---

# 5.2 High-Level Architecture

The MediSync ecosystem consists of the following major components:

```text
                    ┌────────────────────────────┐
                    │      Web Application       │
                    └──────────────┬─────────────┘
                                   │
                             HTTPS / REST API
                                   │
                    ┌──────────────▼─────────────┐
                    │        Backend API         │
                    └──────┬─────────────────┬───┘
                           │                 │
                           ▼                 ▼
             ┌─────────────────────────┐ ┌───────────────┐
             │  Medical Intelligence   │ │  Background   │
             │        Service          │ │  Job Service  │
             └──────┬───────────▲──────┘ └───────┬───────┘
                    │           │                │
                    ▼           │                │
             ┌──────────────┐   │                │
             │ AI Provider  │   │                │
             │ (Gemini, etc)│   │                │
             └──────────────┘   │                │
                                │                │
             ┌──────────────────┴────────────────▼───────┐
             │            PostgreSQL Database            │
             └──────────────────┬────────────────────────┘
                                │
                        ┌───────▼────────┐
                        │ Object Storage │
                        └────────────────┘
```

Each component shall have clearly defined responsibilities.

---

# 5.3 System Components

## Web Application

The Web Application serves as the primary user interface for the MVP.

Responsibilities include:

- User authentication
- Prescription upload
- Dashboard
- Reminder management
- AI chat interface
- Medicine search
- Pharmacy search
- Profile management

The frontend shall not directly communicate with AI providers or the database.

All communication shall pass through the backend API.

---

## Backend API

The Backend API acts as the central coordinator of the system.

Responsibilities include:

- Authentication
- Authorization
- Business logic
- Database communication
- Orchestrating reminders and schedules
- Notification management
- Pharmacy management

The backend delegates clinical context-aware requests (like explanations and custom user chats) to the Medical Intelligence Service.

---

## Medical Intelligence Service

The Medical Intelligence Service acts as the intelligent orchestration layer. It queries the database directly to retrieve verified factual medical data to construct contextually grounded prompts for the AI Provider.

Responsibilities include:

- Intent classification (identifying query type)
- Direct knowledge retrieval from PostgreSQL Database (uses, warnings, side effects)
- Prompt building (grounding prompts with retrieved facts)
- Moderation (safety checking inputs/outputs)
- Response caching
- Abstracting API calls to the AI Provider

---

## Background Job Service

Certain operations should execute asynchronously.

Examples include:

- Reminder scheduling
- Notification delivery
- OCR processing
- AI request queues
- Cleanup jobs
- Cache refresh
- Email delivery

Moving these tasks into background workers improves responsiveness and scalability.

---

## Database

The database serves as the central persistent storage layer.

It shall store:

- Users
- Prescriptions
- Medicines
- Pharmacies
- Reminder schedules
- AI conversation metadata
- Inventory information

The database shall not store AI prompts or API keys.

---

## Object Storage

Prescription images shall be stored separately from the relational database.

Examples include:

- Uploaded prescriptions
- User profile images
- Future medical documents

Only file metadata should be stored within the database.

---

# 5.4 Platform Roadmap

## Phase 1 (Current Scope)

Primary Platform:

- Web Application

Supported Features:

- Authentication
- OCR
- AI Assistant
- Dashboard
- Reminder Engine
- Pharmacy Search
- Prescription History

---

## Phase 2

Secondary Platform:

- Android
- iOS

The mobile application shall reuse the backend APIs developed during Phase 1.

---

# 5.5 Technology Stack

The following technologies are recommended for implementation.

## Frontend

Recommended Framework:

- Next.js

Recommended Language:

- TypeScript

UI Library:

- React

Styling:

- Tailwind CSS

State Management:

- Zustand or Redux Toolkit

---

## Backend

Recommended Framework:

- Fastify

Language:

- TypeScript

Validation:

- TypeBox or Zod

Authentication:

- JWT

---

## Medical Intelligence Service

Recommended Framework:

- FastAPI

Language:

- Python

Responsibilities:

- Intent Classification & Knowledge Retrieval
- Dynamic Prompt Generation
- Moderation Layer & Response Formatting
- Multi-provider Integration (Gemini, MedGemma, Qwen, Llama)

---

## Database

Recommended Database:

- PostgreSQL

ORM:

- Prisma

---

## Cache

Recommended:

- Redis

Used for:

- Session caching
- AI response caching
- Queue management
- Temporary storage

---

## Background Jobs

Recommended:

- BullMQ

Responsibilities:

- Reminder scheduling
- Email delivery
- AI queues
- Notification processing

---

## Storage

Recommended:

- S3 Compatible Object Storage

Possible providers:

- AWS S3
- Cloudflare R2
- MinIO
- Supabase Storage

---

# 5.6 Monorepo Organization

The project shall use a monorepo architecture.

Example structure:

```
medisync/

│
├── apps/
│   ├── web/
│   ├── backend/
│   ├── ai-service/
│   └── mobile/          (Future)
│
├── packages/
│   ├── ui/
│   ├── shared/
│   ├── types/
│   └── utils/
│
├── database/
│
├── docker/
│
├── docs/
│
└── scripts/
```

Shared packages reduce duplication and improve consistency across services.

---

# 5.7 Communication Flow

All client applications shall communicate exclusively with the Backend API.

The Backend API shall coordinate interactions with:

- Database
- AI Service
- Cache
- Background Workers

Clients shall never directly access:

- Database
- AI Providers
- Cache
- Background workers

This architecture improves security and maintainability.

---

# 5.8 Service Boundaries

Each service shall own a specific responsibility.

| Service | Primary Responsibility |
|----------|------------------------|
| Web | User Interface |
| Backend | Business Logic |
| Medical Intelligence Service | Intent classification, knowledge grounding, prompts & LLM coordination |
| PostgreSQL | Persistent Data & Medicine Knowledge Base |
| Redis | Cache & Queues |
| Object Storage | Images & Documents |
| Background Workers | Asynchronous Tasks |

Services should avoid directly depending on one another whenever possible.

Communication should occur through clearly defined APIs.

---

# 5.9 Scalability Strategy

The architecture shall support horizontal scaling.

Examples include:

- Multiple Backend instances
- Multiple AI workers
- Independent reminder workers
- Database replication
- Distributed caching

Individual services should be deployable independently.

---

# 5.10 Error Handling Strategy

Each service shall handle failures independently.

Examples include:

AI Service unavailable:

- Backend returns a meaningful error.
- User may retry later.
- Previously stored prescriptions remain accessible.

Reminder worker unavailable:

- Reminder jobs remain queued.
- Processing resumes when workers recover.

Database connection failure:

- Appropriate error messages shall be displayed.
- Data corruption shall be prevented.

The failure of one service should not unnecessarily affect unrelated system components.

---

# 5.11 Logging & Monitoring

The application shall record logs for:

- Authentication
- OCR processing
- AI requests
- Reminder execution
- API requests
- System errors

Logs shall exclude:

- User passwords
- API keys
- Sensitive medical information where unnecessary

Logging should support future monitoring and debugging without compromising user privacy.

---

# 5.12 Architectural Principles

The following principles guide all future development.

### Separation of Concerns

Each component should have a single responsibility.

---

### AI Isolation

AI should remain isolated behind an internal service layer.

Replacing AI providers should require minimal changes to the rest of the application.

---

### Deterministic First

Traditional software solutions should always be preferred over AI when feasible.

---

### API-First Design

All future clients—including the mobile application—shall consume the same backend APIs.

---

### Modular Development

Each module should be independently testable, maintainable, and replaceable.

---

### Cost Awareness

Architectural decisions shall consider long-term operational costs in addition to technical feasibility.

---

# Phase Summary

This phase defines the architectural foundation of MediSync.

The platform adopts a modular, service-oriented architecture centered around a single Backend API, with dedicated AI processing, background workers, and scalable infrastructure. The design emphasizes maintainability, security, cost efficiency, and future extensibility while ensuring that the Web Application remains the primary focus of the initial MVP and the Mobile Application can be added with minimal backend changes.
