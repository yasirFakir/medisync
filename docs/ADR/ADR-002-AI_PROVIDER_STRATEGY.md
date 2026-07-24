# ADR-002 — AI Provider Strategy

**Status:** Accepted

**Date:** 2026-07-24

**Decision Makers:**
- Project Lead
- Backend Team
- AI Team

---

# Problem

MediSync requires AI for medical explanation and prescription understanding.

Using a single commercial AI provider creates several risks:

- High API costs
- Vendor lock-in
- Rate limits
- Service outages
- Pricing changes
- Difficulty switching providers

The application should remain independent of any specific AI provider.

---

# Decision

All AI providers will be accessed through a single abstraction layer called the **Medical Intelligence Service**.

Application modules must never communicate directly with an LLM provider.

Architecture:

```
Frontend

↓

Backend API

↓

Medical Intelligence Service

↓

AI Provider Adapter

↓

LLM
```

The backend should be able to replace one AI provider with another without affecting business logic.

---

# Supported Providers

The architecture should support multiple providers.

Examples:

- MedGemma (Local)
- Gemma
- OpenAI
- Gemini
- OpenRouter
- Ollama
- LM Studio
- Future Providers

The application should not assume any provider-specific behavior.

---

# Why

This approach provides:

- Low vendor dependency
- Easier testing
- Lower migration cost
- Better scalability
- Future support for local inference
- Better fault tolerance

---

# Rules

### Rule 1

Controllers must never call an AI provider directly.

---

### Rule 2

Business services must communicate only with the Medical Intelligence Service.

---

### Rule 3

The Medical Intelligence Service selects the appropriate provider.

---

### Rule 4

Provider-specific prompts should remain isolated inside provider adapters when necessary.

---

### Rule 5

Application code should never contain provider-specific logic.

---

### Rule 6

API keys must only be accessed by the provider layer.

---

# Provider Selection Strategy

Preferred order during development:

```
Local Model

↓

Free Cloud Model

↓

Paid Provider
```

Example:

```
MedGemma (Local)

↓

Gemini Free

↓

OpenRouter Free

↓

Paid API
```

This minimizes operational costs during development.

---

# Failure Strategy

If the selected provider fails:

```
Retry

↓

Fallback Provider

↓

Cached Response

↓

Graceful Error
```

The application should never crash due to an unavailable AI provider.

---

# Cost Strategy

Before invoking AI:

```
Rule Engine

↓

Database

↓

Cache

↓

AI
```

Only generate a new AI request when necessary.

---

# Future Support

The architecture should support:

- Multiple simultaneous providers
- Automatic provider fallback
- Cost-aware routing
- Local inference
- Load balancing
- Response caching

without major architectural changes.

---

# Consequences

## Advantages

- Provider independence
- Lower migration cost
- Easier experimentation
- Better reliability
- Lower development cost
- Future-proof architecture

## Disadvantages

- Slightly more backend abstraction
- Additional service layer to maintain

---

# Related Documents

- 06_AI_DEVELOPMENT.md
- 11_API_GUIDE.md
- 12_AI_PROMPT_GUIDE.md
- 13_DECISION_POLICY.md

---

# Rationale

Artificial intelligence is a dependency—not the foundation of MediSync.

By isolating provider-specific implementations behind the Medical Intelligence Service, the application remains flexible, maintainable, and resilient to future changes in AI technology or pricing.
