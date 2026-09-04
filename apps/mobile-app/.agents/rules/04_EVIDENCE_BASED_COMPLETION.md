# Rule: Evidence-Based Completion

1. Agents must NEVER claim success using vague statements such as:
   - *"Looks good."*
   - *"Should work."*
   - *"Code seems fine."*
2. Final completion MUST provide verifiable artifacts and evidence:
   - Exact Gradle test execution output (e.g. `BUILD SUCCESSFUL`, `X tests passed, 0 failed`).
   - Emulator launch logs and Logcat excerpts showing error-free operation.
   - UI verification logs or screenshot artifacts.
   - Step-by-step checklist against acceptance criteria with explicit pass/fail marks.
