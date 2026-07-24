# AI Prompt Guide
Version: 1.0

---

# Purpose

This document defines the prompt engineering standards used throughout the MediSync project.

Its purpose is to ensure that AI interactions remain:

- Consistent
- Deterministic
- Cost-efficient
- Safe
- Maintainable

This guide applies to all contributors and AI coding agents responsible for building or modifying AI-powered features.

---

# Prompt Philosophy

AI should reason using verified information whenever possible.

The objective is **not** to ask the smartest question.

The objective is to provide the AI with only the information required to produce a reliable answer.

Every unnecessary token increases:

- Cost
- Latency
- Hallucination risk

---

# Prompt Design Principles

Every prompt should be:

- Clear
- Concise
- Deterministic
- Structured
- Context-aware

Avoid:

- Ambiguous instructions
- Redundant information
- Long conversational prompts
- Multiple unrelated objectives

One prompt should solve one task.

---

# Prompt Structure

Every prompt should follow this structure.

```
System Instructions

↓

Retrieved Context

↓

User Input

↓

Expected Output Format

↓

Constraints
```

Never mix unrelated information.

---

# Prompt Hierarchy

Priority of information:

```
1. System Prompt

↓

2. Retrieved Knowledge

↓

3. User Prompt

↓

4. Conversation History
```

If conflicts occur, higher-priority instructions take precedence.

---

# System Prompt Rules

System prompts define permanent behavior.

They should contain:

- AI role
- Safety rules
- Medical limitations
- Response style
- Output format

System prompts should remain stable.

Avoid changing system prompts frequently.

---

# System Prompt Objectives

The system prompt should instruct the model to:

- Be factual.
- Use retrieved knowledge first.
- Avoid unsupported claims.
- Avoid diagnosis.
- Avoid dosage recommendations.
- State uncertainty when appropriate.
- Encourage professional consultation when necessary.

---

# User Prompt Rules

User prompts should contain only:

- User question
- User intent
- Relevant inputs

Never include:

- Internal instructions
- API implementation
- Database schema
- Hidden reasoning

---

# Context Management

Context is expensive.

Load only the information required for the current request.

Avoid including:

- Entire database records
- Entire conversation history
- Large documentation
- Irrelevant OCR output

Context should be minimal but sufficient.

---

# Token Optimization

Always minimize token usage.

Prefer:

- Structured lists
- Bullet points
- Tables
- Short instructions

Avoid:

- Long explanations
- Duplicate context
- Repeated system instructions

Every token should have a purpose.

---

# Context Window Management

When approaching context limits:

Prefer removing:

1. Old conversation
2. Duplicate information
3. Unused OCR output
4. Irrelevant retrievals

Never remove:

- Safety instructions
- User question
- Retrieved medical knowledge

---

# Retrieval-Augmented Prompting

Whenever structured knowledge exists:

```
Retrieve

↓

Insert Context

↓

Generate Response
```

Never ask AI to guess information already stored in the database.

Retrieved knowledge should always be preferred.

---

# Retrieved Context Rules

Retrieved information should be:

- Structured
- Relevant
- Recent
- Verified

Avoid injecting unrelated database records.

Quality of retrieval directly affects response quality.

---

# OCR Prompting

OCR prompts should focus only on extraction.

Objectives:

- Identify medicine names
- Identify dosage
- Identify frequency
- Identify duration
- Preserve uncertain text
- Report confidence

Never ask OCR prompts to interpret medical meaning.

Extraction and reasoning should remain separate.

---

# Medical Prompting

Medical prompts should:

- Explain information
- Clarify terminology
- Summarize prescriptions
- Describe medicines
- Explain possible side effects
- Explain interactions using retrieved knowledge

Medical prompts should never:

- Diagnose diseases
- Prescribe medication
- Recommend changing dosage
- Recommend stopping treatment
- Replace physician advice

---

# Retrieval Prompt Example

Prompt should resemble:

```
Retrieved Knowledge:

Medicine:
Paracetamol

Uses:
Pain relief
Fever reduction

Warnings:
Liver disease

User Question:
What is this medicine used for?

Instructions:
Answer using only the provided knowledge.
If information is missing, clearly state that.
```

Never instruct the AI to invent missing information.

---

# OCR Prompt Example

Prompt objective:

```
Extract:

- Medicine Name
- Dosage
- Frequency
- Duration

If text is unclear,
mark it as uncertain.

Do not infer missing information.
```

---

# Medical Assistant Prompt Example

Objectives:

- Explain
- Educate
- Warn appropriately
- Remain neutral
- Avoid certainty when uncertain

Preferred tone:

Professional

Clear

Reassuring

Non-alarming

---

# Hallucination Prevention

Hallucinations must be minimized.

Always:

- Prefer retrieved knowledge.
- Prefer structured data.
- State uncertainty.
- Avoid speculation.

If information is unavailable:

Respond with:

"I do not have enough verified information to answer this confidently."

Never fabricate medical facts.

---

# Confidence Handling

AI should distinguish between:

- Verified
- Likely
- Uncertain
- Unknown

Never present uncertain information as factual.

---

# Output Formatting

Responses should be structured.

Prefer:

- Headings
- Bullet lists
- Short paragraphs

Avoid long walls of text.

Consistency improves readability.

---

# Response Length

Default responses should be concise.

Expand only when:

- User requests details.
- Explanation is necessary.
- Safety requires clarification.

Avoid unnecessary verbosity.

---

# Cost Optimization

Before calling AI ask:

Can this be answered using:

- Rule Engine?
- Database?
- Existing business logic?

If YES:

Do not call AI.

Only invoke AI when reasoning or language generation is required.

---

# Prompt Versioning

Prompt templates should be version controlled.

Changes should be documented.

Avoid modifying prompts without testing.

Prompt changes may affect application behavior.

---

# Prompt Testing

Whenever prompts change:

Verify:

- Correctness
- Stability
- Cost
- Latency
- Hallucination rate
- Formatting
- Safety

Treat prompt changes like code changes.

---

# AI Safety Rules

Every prompt should encourage the model to:

- Remain factual
- Avoid assumptions
- Acknowledge uncertainty
- Avoid diagnosis
- Encourage professional consultation for medical concerns

Safety instructions should never be omitted.

---

# AI Review Checklist

Before deploying a prompt:

✓ Minimal context used

✓ Tokens optimized

✓ Retrieved knowledge prioritized

✓ OCR extraction separated from reasoning

✓ Medical safety maintained

✓ Hallucination risk minimized

✓ Output format consistent

✓ Cost considered

✓ Prompt documented

---

# Final Principle

Prompts are part of the application's architecture.

A well-designed prompt should provide the AI with exactly enough information to generate a safe, accurate, and efficient response—nothing more, nothing less.
