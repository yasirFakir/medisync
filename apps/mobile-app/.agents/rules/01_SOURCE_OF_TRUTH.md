# Rule: Source of Truth

1. The existing Web Application (`/data/rspace/codespace/projects/medisync`) is the primary source of truth for product behavior, business logic, API endpoints, and validation rules.
2. The product documentation in `docs/product/` is the extracted representation of that behavior.
3. The Android implementation MUST follow the documented product behavior unless a deliberate native platform-specific UX decision is explicitly documented in `docs/product/PLATFORM_PARITY.md`.
4. If there is a discrepancy between assumptions and the web code, the web codebase takes precedence.
