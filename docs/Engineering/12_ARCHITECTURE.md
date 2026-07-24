# ARCHITECTURE.md

> **Version:** 1.0
> **Project:** MediSync
> **Status:** Baseline Architecture
> **Last Updated:** 2026-07-24

---

# Purpose

This document defines the baseline architecture of MediSync.

It is **not** a detailed design document.

Its purpose is to establish:

* Technology stack
* Major system components
* Communication flow
* Design principles
* Future scalability

Detailed implementation belongs in future architecture documents.

---

# System Overview

MediSync is an AI-assisted medical assistant platform.

Primary features:

* Prescription OCR
* Medicine Information
* Medicine Alternatives
* Medicine Availability
* Reminder Generation
* AI Medical Explanation
* User Authentication

The system follows a modular service-oriented architecture.

---

# Design Principles

The architecture follows these principles.

* Simplicity first.
* Modular design.
* Feature-oriented development.
* AI as an enhancement—not the core.
* Database before AI.
* Rule Engine before AI.
* Easy component replacement.
* Cost-aware architecture.
* Human-readable code.

---

# High-Level Architecture

```text
                    Web Application
                           │
                           ▼
                    Backend API Server
                           │
      ┌──────────────┬──────────────┬──────────────┐
      ▼              ▼              ▼
 Authentication   OCR Service   Medical Service
                                      │
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
                 Medicine Database           AI Provider
                        │                           │
                        └─────────────┬─────────────┘
                                      ▼
                              Response Builder
                                      │
                                      ▼
                                 Frontend UI
```

---

# Technology Stack

## Frontend

### Framework

* Next.js (App Router)

### Language

* TypeScript

### UI

* React
* Tailwind CSS

### State Management

* React Query (TanStack Query)

### Forms

* React Hook Form

### Validation

* Zod

---

## Backend

### Language

Python

### Recommended Version

> **Python 3.12**

Reason:

* Excellent library compatibility
* Stable ecosystem
* Supported by FastAPI, PyTorch, Transformers, OCR libraries, and modern AI tooling
* Better package support than Python 3.13 at the current time

**Do not use Python 3.13 until all required AI libraries officially support it.**

---

### Framework

FastAPI

Reason:

* High performance
* Automatic OpenAPI generation
* Excellent typing support
* Async support
* Large ecosystem

---

### ORM

SQLAlchemy 2.x

---

### Database Migration

Alembic

---

### Validation

Pydantic v2

---

### Authentication

JWT

Refresh Tokens (Future)

---

### Background Tasks

FastAPI Background Tasks

Future:

Celery or Dramatiq if workload grows.

---

# Database

Primary Database

PostgreSQL

Reason:

* Mature
* Reliable
* Strong relational support
* Excellent indexing
* JSON support
* Production-ready

---

# OCR

Preferred Engine

PaddleOCR

Reason:

* Excellent handwriting support
* Active development
* Good multilingual support
* Free
* Runs locally

Possible alternatives

* EasyOCR
* Tesseract
* Google Vision API (Future)

OCR should remain replaceable.

---

# Artificial Intelligence

The application should remain provider-independent.

Possible providers:

Development

* Local MedGemma
* Ollama
* LM Studio
* Gemini Free
* OpenRouter Free Models

Production

* Gemini
* OpenAI
* MedGemma
* Other providers

No business logic should depend on a specific provider.

---

# AI Libraries

Preferred libraries

* Transformers
* PyTorch
* Hugging Face Hub
* Sentence Transformers (Future)
* LangChain *(only if necessary)*
* LlamaIndex *(Future if RAG is adopted)*

Avoid introducing large frameworks unless they solve a real problem.

---

# API Design

Style

REST API

Reasons

* Simpler
* Easier debugging
* Better frontend compatibility

Future

WebSocket

Only for:

* Notifications
* Live updates

---

# Storage

Development

Local Storage

Production

Cloud Object Storage

Examples

* AWS S3
* Cloudflare R2
* Supabase Storage

---

# AI Pipeline

```text
Prescription Image

↓

OCR

↓

Text Cleaning

↓

Medicine Parsing

↓

Database Lookup

↓

Rule Engine

↓

Medical AI (If Required)

↓

Moderation

↓

Response
```

AI is never the first step.

---

# Project Structure

```text
backend/

frontend/

docs/

scripts/

docker/
```

Feature modules should be added as the project grows.

---

# Backend Structure (Initial)

```text
backend/

app/

api/

models/

services/

repositories/

schemas/

core/

utils/

tests/
```

This structure may evolve into feature-based modules later.

---

# Security

* JWT Authentication
* Password Hashing
* Input Validation
* HTTPS (Production)
* Environment Variables
* Secret Management

Medical information must never be exposed through logs.

---

# Logging

Use structured logging.

Log:

* Errors
* Warnings
* API requests
* AI failures

Never log:

* Passwords
* Tokens
* Medical records
* Personal identifiers

---

# Configuration

All configuration should come from environment variables.

Never hardcode:

* API Keys
* Database URLs
* Secrets
* Provider Credentials

---

# Deployment

Development

Docker Compose

Production

Docker

Reverse Proxy

Nginx

Future

* Kubernetes (if needed)
* CI/CD
* Automated deployment

---

# Testing

Unit Tests

Integration Tests

API Tests

OCR Tests

AI Prompt Evaluation (Future)

---

# Scalability

The architecture should allow:

* Swapping OCR engines
* Swapping AI providers
* Adding RAG
* Multiple pharmacies
* Mobile application
* Microservices (Future)

without major architectural redesign.

---

# Future Technologies

Not required for MVP.

Potential future additions:

* Vector Database
* RAG
* Redis Cache
* Celery
* Kafka
* AI Response Cache
* Medical Knowledge Graph
* Elasticsearch

These should only be introduced when justified by project requirements.

---

# Engineering Philosophy

MediSync favors:

* Maintainability over cleverness
* Simplicity over abstraction
* Deterministic logic over AI
* Structured knowledge over generated knowledge
* Modular design over monolithic complexity
* Cost efficiency over unnecessary technology adoption

---

# Final Principle

The architecture should evolve only when the project demands it.

Avoid premature optimization and unnecessary complexity.

Build a stable MVP first, then introduce additional technologies based on real requirements and measured bottlenecks.
