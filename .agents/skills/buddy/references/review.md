# review.md

> **Purpose**
>
> This command guides an AI coding agent to perform a professional code review before code is merged into the main branch.

---

# Primary Objective

Review the code as if you are a senior engineer approving a Pull Request.

The objective is to improve code quality—not to rewrite the implementation.

Reject only when necessary.

---

# Review Philosophy

Review for:

* Correctness
* Maintainability
* Readability
* Reliability
* Security

Do not review based on personal coding preferences.

Follow project standards.

---

# Workflow

Always follow this sequence.

```text id="l1k3vm"
Understand Changes

↓

Analyze Impact

↓

Review Code

↓

Identify Issues

↓

Suggest Improvements

↓

Approve or Request Changes
```

---

# Step 1 — Understand the Change

Determine:

* What problem does this solve?
* Which task does it implement?
* Which files changed?
* What is the expected behavior?

Read the related TASK document if available.

---

# Step 2 — Review Scope

Verify the implementation stays within scope.

Reject if it:

* Implements unrelated features
* Refactors unrelated modules
* Changes architecture unnecessarily

Keep Pull Requests focused.

---

# Step 3 — Functional Review

Verify:

* Requirements are satisfied
* Logic is correct
* Edge cases are handled
* Error handling exists

The implementation should solve the requested problem completely.

---

# Step 4 — Architecture Review

Verify consistency with:

* Existing architecture
* Folder structure
* Service boundaries
* Dependency direction

Avoid duplicated business logic.

---

# Step 5 — Code Quality

Review for:

* Readability
* Simplicity
* Naming
* Modularity
* Reusability

Prefer simple, understandable code.

---

# Step 6 — Security Review

Verify:

* Input validation
* Authentication
* Authorization
* Secret handling
* Sensitive data protection

Follow:

```text
13_SECURITY_GUIDE.md
```

Reject security regressions.

---

# Step 7 — Database Review

Verify:

* Queries are efficient
* Transactions are correct
* Migrations are safe
* Constraints are respected

Avoid unnecessary database operations.

---

# Step 8 — API Review

Verify:

* REST conventions
* Proper status codes
* Consistent responses
* Validation
* Error handling

---

# Step 9 — AI Review

If AI is involved:

Verify:

* AI is not replacing deterministic logic
* Prompts are modular
* Hallucination risk is minimized
* Moderation exists where required

---

# Step 10 — Testing Review

Verify:

* Existing tests still pass
* New behavior is tested
* Edge cases are covered

Reject features with no reasonable validation.

---

# Step 11 — Performance Review

Check for:

* Duplicate queries
* Unnecessary loops
* Repeated API calls
* Unnecessary AI requests

Prefer efficient implementations.

---

# Review Checklist

Confirm:

* Correctness
* Readability
* Security
* Maintainability
* Performance
* Testability
* Documentation
* Project consistency

---

# Review Severity

Categorize findings as:

### Critical

Must be fixed before merge.

Examples:

* Security issue
* Data loss
* Incorrect behavior
* Broken functionality

---

### Major

Should be fixed before merge.

Examples:

* Poor architecture
* Missing validation
* Large code duplication

---

### Minor

Optional improvements.

Examples:

* Better naming
* Cleaner formatting
* Small refactors

---

### Suggestion

Ideas for future improvement.

Do not block merging.

---

# Completion Report

Provide:

```text
Overall Assessment

Strengths

Critical Issues

Major Issues

Minor Issues

Suggestions

Merge Recommendation
```

---

# Merge Recommendation

Choose exactly one:

* ✅ Approve
* ⚠️ Approve with Minor Suggestions
* ❌ Request Changes

Always justify the recommendation.

---

# Rules

Never:

* Rewrite the entire implementation
* Request changes based on personal preference
* Introduce scope creep

Always:

* Review objectively
* Reference project standards
* Focus on maintainability
* Respect the original implementation

---

# Token Optimization

Read only:

* Changed files
* Related TASK
* Relevant ADRs
* Required engineering guides

Avoid reviewing unrelated parts of the repository.

---

# Success Criteria

A successful review:

* Improves software quality
* Protects project architecture
* Prevents regressions
* Encourages maintainable code
* Provides actionable feedback

The goal is to help the team deliver reliable software—not to achieve perfection.
