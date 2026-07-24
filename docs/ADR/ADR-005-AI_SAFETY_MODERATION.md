# ADR-005 — AI Safety and Medical Moderation

**Status:** Accepted

**Date:** 2026-07-24

**Decision Makers:**
- Project Lead
- Backend Team
- AI Team

---

# Problem

MediSync is a medical assistance application.

Unlike general-purpose chatbots, incorrect responses may influence real healthcare decisions.

Large Language Models can:

- Hallucinate facts
- Give unsafe medical advice
- Recommend incorrect dosages
- Misinterpret prescriptions
- Sound overly confident

Medical AI must therefore be treated as an assistant—not an authority.

---

# Decision

Every AI-generated medical response must pass through a moderation layer before being returned to the user.

Pipeline:

```
User Request

↓

Medical Intelligence

↓

Moderation Engine

↓

Approved Response

↓

User
```

Unsafe responses must be rejected, rewritten, or replaced with a safer alternative.

---

# Why

Medical software must prioritize:

- Patient safety
- Transparency
- Reliability
- Responsible AI usage

The goal is to assist users—not replace healthcare professionals.

---

# Safety Principles

MediSync will:

- Explain medical information.
- Simplify prescriptions.
- Identify possible concerns.
- Encourage professional consultation.

MediSync will NOT:

- Diagnose diseases.
- Replace physicians.
- Prescribe medication.
- Recommend dosage changes.
- Guarantee medical correctness.

---

# Moderation Responsibilities

The moderation layer should detect:

- Dangerous medical advice
- Unsupported claims
- Confident diagnoses
- Unsafe dosage recommendations
- Contradictory statements
- Hallucinated medicines
- Fabricated medical facts

Responses violating these rules should not be shown to users.

---

# Confidence Policy

Responses should communicate confidence.

Possible confidence levels:

```
High

Medium

Low

Unknown
```

Low-confidence outputs should explicitly state uncertainty.

Example:

> "The prescription could not be interpreted confidently. Please consult a pharmacist or upload a clearer image."

---

# Disclaimer Policy

Medical responses should include an appropriate disclaimer when necessary.

Example:

> "This information is intended for educational purposes and should not replace advice from a licensed healthcare professional."

Disclaimers should be concise and not overwhelm the user.

---

# Rules

### Rule 1

AI should educate—not diagnose.

---

### Rule 2

AI should explain—not prescribe.

---

### Rule 3

AI should acknowledge uncertainty.

---

### Rule 4

AI should never fabricate information.

---

### Rule 5

Every medical recommendation must be based on verified knowledge whenever possible.

---

### Rule 6

Users should be encouraged to consult healthcare professionals for important medical decisions.

---

# Failure Strategy

If moderation detects an unsafe response:

```
Reject Response

↓

Attempt Safer Regeneration

↓

If Still Unsafe

↓

Return Safe Fallback Message
```

The application should always fail safely.

---

# Future Support

The moderation layer should support:

- Rule-based moderation
- AI-assisted moderation
- Confidence scoring
- Medical policy updates
- Provider-independent moderation logic

---

# Consequences

## Advantages

- Safer AI interactions
- Reduced hallucination risk
- Better user trust
- Easier regulatory compliance
- Consistent medical communication

## Disadvantages

- Slight increase in response latency
- Additional moderation logic to maintain

---

# Related Documents

- SRS.md
- 06_AI_DEVELOPMENT.md
- 09_SECURITY_GUIDE.md
- 12_AI_PROMPT_GUIDE.md
- 13_DECISION_POLICY.md

---

# Rationale

Artificial Intelligence is a powerful assistant, but it is not a licensed medical professional.

Every AI response must prioritize patient safety, communicate uncertainty honestly, and support—not replace—professional medical care.
