# MediSync Android — Autonomous Multi-Agent System Guidelines

## 1. Prime Directives
1. **Source of Truth:** The reference web application at `/data/rspace/codespace/projects/medisync` is the authoritative source for product behavior, validation, and API contracts. The web codebase is **READ-ONLY**.
2. **Clean Android Native:** Target workspace is `/home/roman/links/projects/temp-files/medisync-android`. Build clean, idiomatic Kotlin / Jetpack Compose code with Clean Architecture (Data, Domain, Presentation).
3. **No Invented Functionality:** If behavior is unknown or unverified, mark as `UNKNOWN` and seek clarification. Never guess API schemas or business rules.
4. **Evidence-Based Completion:** Success requires verifiable Gradle test execution output, build logs, and emulator verification results. Never use vague phrases like "looks good".
5. **Retry Cap & Skip Guard:** Maximum **3 self-healing retries** per task. If unresolved, log details to `docs/BLOCKED_TASKS.md`, mark task as blocked, and proceed autonomously to the next task.

---

## 2. Core Agent Roles
1. **Web Analyst:** Inspects web reference code and maintains `docs/product/`.
2. **Android Architect:** Plans clean Android architecture, domain models, ViewModels, and navigation.
3. **Android Builder:** Implements Kotlin, Jetpack Compose, Retrofit/Ktor, Room, and Coroutines.
4. **Android Tester:** Writes and executes unit, ViewModel, repository, and Compose UI tests.
5. **Android QA:** Runs emulator smoke tests, inspects Logcat for errors, and captures evidence.
6. **Cross-Platform Reviewer:** Verifies parity between Android and Web before signing off.

---

## 3. Workflows & Documentation Map
- **Product Specifications:** [docs/product/FEATURES.md](file:///home/roman/links/projects/temp-files/medisync-android/docs/product/FEATURES.md)
- **User Flows:** [docs/product/USER_FLOWS.md](file:///home/roman/links/projects/temp-files/medisync-android/docs/product/USER_FLOWS.md)
- **Business Rules:** [docs/product/BUSINESS_RULES.md](file:///home/roman/links/projects/temp-files/medisync-android/docs/product/BUSINESS_RULES.md)
- **API Contract:** [docs/product/API_CONTRACT.md](file:///home/roman/links/projects/temp-files/medisync-android/docs/product/API_CONTRACT.md)
- **Platform Parity:** [docs/product/PLATFORM_PARITY.md](file:///home/roman/links/projects/temp-files/medisync-android/docs/product/PLATFORM_PARITY.md)
- **Task Registry:** [docs/tasks/OVERVIEW.md](file:///home/roman/links/projects/temp-files/medisync-android/docs/tasks/OVERVIEW.md)
- **Workflows:** [docs/workflows/](file:///home/roman/links/projects/temp-files/medisync-android/docs/workflows/)
