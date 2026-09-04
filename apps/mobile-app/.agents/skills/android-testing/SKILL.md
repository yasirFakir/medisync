---
name: android-testing
description: Execute and verify Android unit tests, viewmodel tests, repository mocks, and Compose UI tests.
---

# Android Testing Skill

## Test Execution Commands
- Run all unit tests: `./gradlew testDebugUnitTest`
- Run lint checks: `./gradlew lintDebug`
- Run connected/instrumented tests (with emulator running): `./gradlew connectedAndroidTest`

## Standard Test Patterns
1. **ViewModel Tests:** Test state emission transitions using `kotlinx.coroutines.test.runTest` and `Turbine`.
2. **Repository Tests:** Mock API services using `MockK` or `MockWebServer`.
3. **Compose UI Tests:** Verify composable nodes and assertions via `createComposeRule()`.
