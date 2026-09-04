# Phase 5: System Integration, Emulator QA & DoD Sign-Off

**Status:** `NOT STARTED`  
**Target Delivery:** Full Unit & UI Test Suite Pass, Android Emulator Smoke Tests, Zero Logcat Crashes, Platform Parity Audit.

---

## Tasks Breakdown

### Task 5.1: Automated Test Suite Execution
- [ ] Execute `./gradlew testDebugUnitTest` across all packages (Data, Domain, Presentation).
- [ ] Execute Compose UI tests verifying interactive flows (Triage chat send, Prescription edit, OTP generator countdown).
- [ ] Verify test coverage metrics and generate JUnit test XML reports.

### Task 5.2: Android Emulator Installation & Smoke QA
- [ ] Build debug APK: `./gradlew assembleDebug`.
- [ ] Launch Android emulator via ADB: `emulator -avd <name> -no-audio &`.
- [ ] Install APK: `adb install -r app/build/outputs/apk/debug/app-debug.apk`.
- [ ] Launch `MainActivity` and perform smoke test across Patient, Doctor, and Pharmacy navigation flows.
- [ ] Capture Logcat stream and verify zero `AndroidRuntime` fatal crashes or ANRs.
- [ ] Capture UI screenshots of all key screens and store in artifacts.

### Task 5.3: Cross-Platform Parity Audit & Definition of Done Sign-off
- [ ] Cross-check all implemented endpoints against `docs/product/API_CONTRACT.md`.
- [ ] Cross-check business calculations against `docs/product/BUSINESS_RULES.md`.
- [ ] Verify all items in `docs/product/ACCEPTANCE_CRITERIA.md`.
- [ ] Update `docs/product/PLATFORM_PARITY.md` with final verification notes.
- [ ] Deliver final auditable sprint report.
