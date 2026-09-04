# Workflow: Web Feature Synchronization

```mermaid
graph TD
    A[Web Application Updated] --> B[1. Web Analyst: Diff Web Changes & Update Docs]
    B --> C[2. Android Architect: Identify Impact on Android App]
    C --> D[3. Android Builder: Update Android DTOs, Repos & UI]
    D --> E[4. Android Tester: Run Full Test Suite]
    E --> F[5. Android QA: Emulator Acceptance Testing]
    F --> G[6. Cross-Platform Reviewer: Update Parity Matrix]
```

1. **Detect Changes:** Web Analyst inspects modified web components or backend routes.
2. **Update Specs:** Update `docs/product/API_CONTRACT.md` and `docs/product/FEATURES.md`.
3. **Android Alignment:** Architect and Builder update DTOs, API endpoints, and UI views to match.
4. **Parity Sign-off:** Reviewer verifies that both platforms remain functionally synchronized.
