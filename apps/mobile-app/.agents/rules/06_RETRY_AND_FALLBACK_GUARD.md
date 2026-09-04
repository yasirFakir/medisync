# Rule: Max Retries, Non-Blocking Fallback & Skip Policy

## Purpose
Prevents the autonomous agent system from getting stuck in an infinite retry loop when encountering difficult bugs, external SDK issues, or blockers requiring human intervention.

## Guardrail Rules
1. **Max Retry Cap:** An agent may attempt a maximum of **3 self-healing retries** on any single failing build, test, or QA task.
2. **Skip & Fallback Action:** If the issue is not resolved after 3 attempts:
   - **DO NOT CRASH OR HALT THE ENTIRE SPRINT.**
   - Isolate the failing component and mark the task status as `[BLOCKED: REQUIRES_USER_INTERVENTION]`.
   - Log the failure reason, stack trace, and exact reproduction steps in `docs/BLOCKED_TASKS.md`.
   - Safely roll back or stub the blocker so it does not prevent downstream independent tasks from building.
   - Automatically proceed to the next task in the queue.
3. **End-of-Run Reporting:** Highlight all blocked tasks in the final auditable report with clear root-cause diagnosis and actionable recommendations for the user.
