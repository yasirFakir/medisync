---
name: cross-platform-parity
description: Cross-compare Android implementation against reference Web application behavior and API specs to ensure full product parity.
---

# Cross-Platform Parity Skill

## Parity Verification Procedure
1. Compare Android API requests against `docs/product/API_CONTRACT.md` (check headers, query params, payloads).
2. Validate business calculations against `docs/product/BUSINESS_RULES.md` (e.g. matching score formula, discount/tax calculations).
3. Validate error codes and UI fallback messaging against web behavior.
4. Record verified parity status in `docs/product/PLATFORM_PARITY.md`.
