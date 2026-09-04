# Workflow: Autonomous Sprint Execution

```mermaid
graph TD
    A[Define Sprint Backlog] --> B[Sort Independent Feature Tasks]
    B --> C[Loop Through Features via Feature Development Workflow]
    C --> D[Run Full Integrated Test Suite & Static Lint]
    D --> E[Run Full Emulator User Flow Smoke Test]
    E --> F[Generate Auditable Sprint Report with Evidence]
```

1. **Backlog Prioritization:** Group independent feature modules (e.g. Auth $\rightarrow$ Triage $\rightarrow$ Prescriptions $\rightarrow$ Alternatives $\rightarrow$ OTP $\rightarrow$ Alerts).
2. **Sequential Autonomous Execution:** Run the full Feature Development workflow on each backlog item.
3. **Integration Verification:** Run full `./gradlew test` and end-to-end emulator smoke tests.
4. **Sprint Audit Report:** Produce auditable completion report documenting test counts, build outputs, and parity checks.
