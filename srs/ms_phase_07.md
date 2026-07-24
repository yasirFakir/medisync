# Phase 07
# API Design & Backend Services

---

# 7. API Design & Backend Services

## 7.1 Overview

The Backend API serves as the central communication layer of MediSync.

All client applications, including the Web Application and future Mobile Application, shall communicate exclusively through the Backend API.

The Backend API is responsible for:

- Authentication
- Authorization
- Business Logic
- Database Operations
- AI Request Coordination
- Reminder Scheduling
- Pharmacy Integration
- Notification Management

No client application shall communicate directly with the database, AI service, cache, or object storage.

---

# 7.2 API Design Principles

The MediSync API shall follow the following principles.

### RESTful Design

The API shall follow REST principles wherever applicable.

Resources should be represented using nouns rather than actions.

Examples:

```
/users
/prescriptions
/reminders
/pharmacies
/medicines
```

---

### Stateless Communication

Each request shall contain all information required for processing.

The server shall not depend on client session state.

---

### Versioning

API endpoints should be versioned.

Example:

```
/api/v1/
```

Future breaking changes shall be introduced through newer API versions rather than modifying existing endpoints.

---

### Consistent Responses

Every API response should follow a consistent structure.

Successful Response

```json
{
    "success": true,
    "message": "Prescription uploaded successfully.",
    "data": { }
}
```

Error Response

```json
{
    "success": false,
    "message": "Invalid prescription image.",
    "errors": [ ]
}
```

This consistency simplifies frontend development.

---

# 7.3 Authentication

Protected endpoints shall require authentication.

Authentication should use secure access tokens.

Unauthenticated requests shall return an authorization error.

Authentication responsibilities include:

- Login
- Registration
- Password Reset
- Email Verification
- Session Validation

---

# 7.4 Authorization

The Backend shall enforce Role-Based Access Control (RBAC).

Every request shall verify:

- User identity
- User role
- Resource ownership

Users shall never access resources belonging to another user unless explicitly permitted.

---

# 7.5 Service Responsibilities

The Backend API shall expose services grouped by responsibility.

---

## Authentication Service

Responsibilities:

- Register users
- Login
- Logout
- Password reset
- Email verification

---

## User Service

Responsibilities:

- Profile retrieval
- Profile update
- Notification preferences
- Account settings

---

## Prescription Service

Responsibilities:

- Upload prescription
- Retrieve prescriptions
- Update OCR results
- Delete prescriptions
- Search prescription history

---

## OCR Service

Responsibilities:

- Receive uploaded prescription
- Coordinate AI OCR processing
- Validate OCR results
- Return structured medicine data

The OCR Service shall not permanently store extracted information until confirmed by the user.

---

## Medicine Service

Responsibilities:

- Retrieve medicine information
- Search medicine database
- Retrieve generic alternatives
- Display medicine details

Medicine equivalence shall be determined using structured database information rather than AI inference.

---

## Reminder Service

Responsibilities:

- Generate reminder schedules
- Update reminders
- Delete reminders
- Record reminder completion
- Retrieve reminder history

---

## Pharmacy Service

Responsibilities:

- Search pharmacies
- Retrieve inventory
- Update inventory (authorized users)
- Display medicine availability

---

## Medical Intelligence Service

Responsibilities:

- Intent Classification (routing queries based on user intent)
- Knowledge Retrieval (retrieving verified structured clinical guidelines/records from the DB)
- Prompt Construction (building safe, contextual LLM prompts)
- AI Provider Selection (routing prompts dynamically to the correct AI Provider)
- Response Validation (ensuring structural and technical consistency of outputs)
- Moderation (analyzing inputs and outputs for clinical safety)
- Response Formatting (converting outputs to standardized patient-friendly formats)
- Cache Management (reducing repeated inference costs)

This service shall remain isolated from other backend business logic modules.

---

## Notification Service

Responsibilities:

- Reminder notifications
- Email notifications
- System announcements
- Future push notifications

Notifications should be generated asynchronously whenever possible.

---

# 7.6 API Request Flow

Typical request lifecycle:

```
Client

↓

Authentication

↓

Authorization

↓

Validation

↓

Business Logic

↓

Database / AI

↓

Response Formatting

↓

Client
```

Every request should follow this sequence.

---

# 7.7 Validation

All incoming requests shall be validated before business logic execution.

Validation should include:

- Required fields
- Data types
- Length limits
- File validation
- Input sanitization

Invalid requests shall never reach database operations.

---

# 7.8 Error Handling

The API shall return meaningful error responses.

Examples include:

- Authentication Failure
- Authorization Failure
- Validation Error
- Resource Not Found
- Rate Limit Exceeded
- AI Processing Failure
- OCR Failure
- Internal Server Error

Sensitive implementation details shall never be exposed in API responses.

---

# 7.9 File Upload Handling

Prescription uploads shall follow the following workflow.

1. Upload image
2. Validate file
3. Store image securely
4. Queue OCR processing
5. Return processing status
6. Notify client upon completion

Large image processing should occur asynchronously.

---

# 7.10 Background Processing

Long-running operations shall not block client requests.

Suitable background tasks include:

- OCR processing
- AI generation
- Reminder scheduling
- Email delivery
- Notification dispatch
- Cache updates

The API should acknowledge requests immediately whenever background processing is appropriate.

---

# 7.11 AI Provider Interface

The Medical Intelligence Service shall interact with external LLMs and Vision models exclusively through a standardized AI Provider Interface.

```text
Medical Intelligence Service
            │
            ▼
   Provider Interface
            │
   ┌────────┼────────┬────────┐
   ▼        ▼        ▼        ▼
MedGemma  Gemma    Qwen     Llama
```

The Provider Interface abstracts the API schemas, communication protocols, and authentication methods of different AI providers. 

This provides key benefits:
- **Zero-Code Backend Model Swaps**: New LLMs or API providers can be introduced by writing a single interface class. No core business logic or backend flow changes are required.
- **Failover Capabilities**: If the primary provider (e.g., Gemini) returns a rate-limit error or experiences downtime, the provider interface automatically falls back to an alternative model (e.g., Qwen or Llama).
- **Request/Response Normalization**: All external API structures are normalized into consistent internal request and response schemas.

---

# 7.12 API Security

The API shall implement security measures including:

- HTTPS
- Authentication
- Authorization
- Request validation
- File validation
- Rate limiting
- Secure headers

Security requirements are further detailed in Phase 08.

---

# 7.13 Logging

The Backend shall log:

- Authentication events
- API requests
- OCR jobs
- AI requests
- Errors
- Warning events

Sensitive information shall never be written to application logs.

---

# 7.14 API Performance

The Backend should optimize response time by:

- Pagination
- Query optimization
- Response caching
- Database indexing
- Background processing

Expensive operations should be avoided during synchronous requests whenever possible.

---

# 7.15 API Extensibility

The API shall support future expansion without breaking existing clients.

Future modules may include:

- Doctor Portal
- Pharmacy Portal
- Hospital Integration
- Electronic Health Records
- Insurance Systems
- Laboratory Reports

The API architecture should accommodate these additions through modular services rather than major redesign.

---

# Phase Summary

The Backend API is the communication backbone of MediSync. It centralizes authentication, authorization, business logic, AI orchestration, and data access while exposing a consistent, secure, and extensible interface to all client applications. By isolating AI interactions behind a dedicated service layer and enforcing validation, asynchronous processing, and standardized responses, the API provides a scalable foundation for both the initial Web Application and future Mobile Application.
