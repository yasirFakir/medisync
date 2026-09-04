# Rule: Definition of Done (DoD)

A feature, sprint, or bug fix is complete ONLY when ALL of the following criteria are satisfied:
1. **Requirements Satisfied:** All documented acceptance criteria from `docs/product/ACCEPTANCE_CRITERIA.md` are fulfilled.
2. **Implementation Complete:** Fully functional Kotlin / Jetpack Compose code adheres to clean architecture (Data, Domain, UI layers).
3. **Automated Tests Pass:** Unit tests (JUnit 5, MockK, Coroutines Test) and Compose UI tests execute and pass without errors.
4. **Gradle Build Succeeds:** `./gradlew assembleDebug` and `./gradlew test` exit with code 0.
5. **Static Analysis & Lint Passes:** `./gradlew lint` or ktlint passes without critical issues.
6. **Emulator / UI QA Verification:** The app launches on the Android emulator, reaches target screens, validates inputs, and produces zero uncaught exceptions in Logcat.
7. **Platform Parity Verified:** Cross-Platform Reviewer verifies functional parity against the web application.
8. **Documentation Updated:** `docs/product/` and progress tracking are updated with exact test evidence.
