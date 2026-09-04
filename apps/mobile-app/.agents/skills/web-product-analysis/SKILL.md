---
name: web-product-analysis
description: Inspect the reference web application to extract features, user flows, business logic, and API contracts for Android feature planning.
---

# Web Product Analysis Skill

## Purpose
Enables an agent to quickly inspect `/data/rspace/codespace/projects/medisync` (read-only) and extract ground truth for:
- API endpoint paths, HTTP verbs, and request/response payloads.
- UI state transitions (loading, error, empty, success).
- Form validation rules and calculations.

## Standard Inspection Procedure
1. Check `apps/backend/src/routes/*.routes.ts` for exact route paths and middleware.
2. Check `apps/backend/src/controllers/*.controller.ts` and `apps/backend/src/services/*.service.ts` for data transformations.
3. Check `apps/web-portals/src/pages/*.tsx` for UI behavior and interaction states.
4. Record findings in `docs/product/` before implementing any code.
