# Workflow: Autonomous Bug Fix

```mermaid
graph TD
    A[Reported Bug / Issue] --> B[1. Reproduce Bug in Unit Test or Emulator]
    B --> C[2. Collect Evidence: Stack Trace, Logcat, Network Logs]
    C --> D[3. Android Builder: Apply Minimal Targeted Fix]
    D --> E[4. Android Tester: Run Regression Test Suite]
    E -->|Fails| D
    E -->|Passes| F[5. Android QA: Verify Resolution on Emulator]
    F --> G[6. Cross-Platform Reviewer: Verify Web Parity & Complete]
```

1. **Reproduce & Isolate:** Create a reproducing unit test or execute the exact step sequence on the emulator.
2. **Root Cause Analysis:** Inspect logs and pinpoint defect (network parser, state mutation, or UI lifecycle).
3. **Targeted Fix:** Builder modifies only affected files without altering unrelated features.
4. **Regression Verification:** Run full test suite to ensure zero collateral regressions.
