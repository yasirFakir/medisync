# API Guide
Version: 1.0

---

# Purpose

This document defines the API standards, conventions, and best practices used throughout the MediSync project.

All backend APIs should be predictable, secure, maintainable, and consistent.

This guide applies to all contributors, including AI coding agents.

---

# API Philosophy

APIs are contracts between the backend and clients.

Every API should be:

- Consistent
- Predictable
- Versionable
- Secure
- Well documented

Breaking an API contract should be avoided whenever possible.

---

# API Architecture

Client applications must never communicate directly with:

- Database
- AI Providers
- OCR Providers
- Notification Services

Communication flow:

```
Client

↓

REST API

↓

Service Layer

↓

Repository

↓

Database
```

External services are accessed only through backend services.

---

# API Style

The project follows RESTful API principles.

Resources should be represented using nouns.

Examples:

```
/users

/prescriptions

/medicines

/reminders

/pharmacies
```

Avoid action-based endpoints.

Bad:

```
/getMedicines

/createReminder

/deleteUser
```

Good:

```
GET /medicines

POST /reminders

DELETE /users/{id}
```

---

# HTTP Methods

Use methods according to their intended purpose.

```
GET

Retrieve resources
```

```
POST

Create resources
```

```
PUT

Replace an existing resource
```

```
PATCH

Partially update a resource
```

```
DELETE

Delete a resource
```

Do not misuse HTTP methods.

---

# API Versioning

All public APIs should be versioned.

Example:

```
/api/v1/
```

Future breaking changes should introduce a new version rather than modifying existing endpoints.

---

# Endpoint Naming

Use:

- lowercase
- plural nouns
- kebab-case where necessary

Examples:

```
/api/v1/users

/api/v1/prescriptions

/api/v1/pharmacy-inventory
```

Avoid verbs in endpoint names.

---

# Request Body

Request payloads should:

- Contain only required fields.
- Follow consistent naming.
- Be validated before processing.

Reject malformed requests.

---

# Response Structure

All responses should follow a consistent format.

Success:

```json
{
    "success": true,
    "data": {},
    "message": "Operation completed successfully."
}
```

Failure:

```json
{
    "success": false,
    "error": {
        "code": "RESOURCE_NOT_FOUND",
        "message": "Prescription not found."
    }
}
```

Maintain a consistent structure across all endpoints.

---

# HTTP Status Codes

Use standard HTTP status codes.

```
200 OK
```

Successful retrieval.

```
201 Created
```

Successful creation.

```
204 No Content
```

Successful deletion.

```
400 Bad Request
```

Invalid client request.

```
401 Unauthorized
```

Authentication required.

```
403 Forbidden
```

Permission denied.

```
404 Not Found
```

Resource not found.

```
409 Conflict
```

Conflict with existing resource.

```
422 Unprocessable Entity
```

Validation failed.

```
429 Too Many Requests
```

Rate limit exceeded.

```
500 Internal Server Error
```

Unexpected server error.

Never return 200 for failed operations.

---

# Validation

Every endpoint must validate:

- Required fields
- Data types
- Value ranges
- File types
- File sizes
- Authentication
- Authorization

Never trust client input.

---

# Authentication

Protected endpoints require authentication.

Public endpoints should be explicitly defined.

Authentication logic should never be duplicated across controllers.

---

# Authorization

Authentication identifies users.

Authorization determines permissions.

Every protected resource should verify ownership or access rights.

---

# Pagination

Large collections should support pagination.

Recommended parameters:

```
?page=1

&limit=20
```

Never return excessive records in a single request.

---

# Filtering

Support filtering where appropriate.

Examples:

```
?status=active

?medicine=paracetamol

?generic=true
```

Filtering should remain predictable.

---

# Sorting

Support sorting using explicit parameters.

Example:

```
?sort=created_at

?order=desc
```

Avoid hidden sorting behavior.

---

# Searching

Search endpoints should:

- Support partial matches where appropriate.
- Return paginated results.
- Be indexed for performance.

Search should remain fast and deterministic.

---

# File Uploads

Uploaded files must be validated.

Verify:

- MIME type
- Extension
- Maximum size
- Processing limits

Reject invalid files.

---

# OCR Endpoints

OCR endpoints should return:

- Processing status
- Extracted text
- Confidence score
- Parsed medicines
- Validation errors (if any)

Separate OCR processing from AI interpretation.

---

# AI Endpoints

AI endpoints should never expose:

- Prompt templates
- Internal reasoning
- Provider implementation
- API keys

Only return finalized, moderated responses.

---

# Error Responses

Errors should:

- Be consistent
- Be descriptive
- Avoid internal implementation details

Bad:

```
NullPointerException
```

Good:

```
Unable to process the prescription.
Please try again.
```

---

# Rate Limiting

Sensitive endpoints should implement rate limiting.

Examples:

- Login
- OCR Upload
- AI Requests
- Password Reset

Protect against abuse.

---

# Idempotency

GET requests should always be idempotent.

PUT and DELETE operations should also remain idempotent whenever possible.

Repeated requests should not produce unexpected behavior.

---

# API Documentation

Every endpoint should include:

- Purpose
- Method
- Route
- Authentication requirements
- Request parameters
- Request body
- Response format
- Error responses

Documentation should remain synchronized with implementation.

---

# Performance

Optimize:

- Database queries
- Response size
- Serialization
- Pagination

Avoid unnecessary API calls.

Avoid duplicate responses.

---

# Logging

Log:

- Endpoint accessed
- Status code
- Processing time
- Request identifier

Never log:

- Passwords
- Tokens
- Medical images
- Sensitive patient information

---

# Security

Protect every endpoint against:

- SQL Injection
- XSS
- CSRF (where applicable)
- Unauthorized access
- Malformed requests

Validate all incoming data.

---

# AI Usage Policy

The API should prioritize deterministic responses.

Decision flow:

```
Request

↓

Business Logic

↓

Database Retrieval

↓

AI (Only if Required)

↓

Moderation

↓

Response
```

Avoid unnecessary AI requests.

---

# API Review Checklist

Before merging:

✓ Endpoint follows REST principles

✓ Input validation implemented

✓ Authentication verified

✓ Authorization verified

✓ Correct status codes used

✓ Response format consistent

✓ Error handling implemented

✓ Pagination supported where needed

✓ Documentation updated

✓ Security verified

---

# Final Principle

An API should be intuitive enough that another developer can use it without reading its implementation.

Consistency is more valuable than cleverness.
