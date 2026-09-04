# MediSync Platform Parity Specification (Web vs. Android Native)

The goal is **functional and product parity** with idiomatic, native Android UX (Material 3 / Jetpack Compose) rather than pixel-for-pixel visual cloning of the desktop web portal.

---

## 1. Persona & Architectural Scope for Android

The native Android app focuses on the high-mobility personas:
1. **Primary Focus:** **Patient Native Experience** (high mobile usage: emergency triage, camera-based prescription scanning, real-time OTP access, push notification medication alarms, pharmacy locator with GPS).
2. **Secondary Support:** **Doctor & Pharmacist On-The-Go** (quick patient lookup, emergency EHR OTP unlock, quick barcode/dispensing verification).

---

## 2. Web vs. Android Native UX Translation Matrix

| Feature Domain | Web Portal UX Pattern | Android Native UX Pattern (Compose / Material 3) | Parity Status |
| :--- | :--- | :--- | :--- |
| **Global Navigation** | 280px fixed desktop sidebar with left active border (`border-l-4`) | Material 3 `NavigationBar` (Bottom Bar) with Top App Bar and Modal Navigation Drawer for secondary settings | **PARITY REQUIRED** |
| **Prescription Digitization**| Desktop file dropzone (`<input type="file">`) | Native Camera capture with live viewfinder preview (`ActivityResultContracts.TakePicture`) + Gallery Picker | **ANDROID ENHANCED** |
| **Symptom Triage Chat** | Multi-column chat pane with selectable symptom chips at top | Mobile conversational stream with Sticky Bottom Input Bar and flowing filter chips (`AssistChip` / `FilterChip`) | **PARITY REQUIRED** |
| **Generic Alternatives** | Grid of comparison cards with modal side-by-side table | Vertical scrollable Cards with expandable Bottom Sheet comparison modal (`ModalBottomSheet`) | **PARITY REQUIRED** |
| **Dynamic OTP Access** | Centered modal popup with 30s circular countdown SVG | High-security Quick-Action Sheet with large monospace OTP digits and haptic feedback on copy | **PARITY REQUIRED** |
| **Medication Alerts** | Browser notification toasts & static table list | Native Android `AlarmManager` + `WorkManager` background alarms with Heads-Up Push Notifications | **ANDROID ENHANCED** |
| **Pharmacy Locator** | Map iframe / responsive grid directory | Native Map integration (Google Maps / OpenStreetMap Compose) with device GPS geolocation permissions | **ANDROID ENHANCED** |
| **EHR Timeline** | Desktop multi-column timeline tree | Native Material `LazyColumn` clinical timeline cards with expandable record summaries | **PARITY REQUIRED** |

---

## 3. Categorized Feature Matrix

### 3.1 Features Android MUST Support (Core Parity)
- [x] JWT Authentication, Refresh Token rotation, and Secure Keystore / EncryptedSharedPreferences storage.
- [x] AI Symptom Triage conversational session with urgency badge rendering (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- [x] Prescription OCR upload, extraction review, manual line-item edits, and cloud wallet synchronization.
- [x] Generic Medicine Alternatives lookup with deterministic scoring $(0.60 \times P_{\text{score}} + 0.40 \times Q_{\text{score}})$.
- [x] Pharmacy Locator and multi-store medicine availability query.
- [x] Dynamic 30-second TOTP generator for granting doctor/pharmacy access.
- [x] Doctor OTP verification and EHR timeline viewer.

### 3.2 Features with Android-Specific Native UX Enhancements
- **Camera OCR Capture:** Direct camera scan using CameraX API instead of relying only on static gallery file upload.
- **Background Alarms:** Android system `AlarmManager` with exact alarm permission (`SCHEDULE_EXACT_ALARM`) for reliable medication reminders even when the app is closed.
- **Biometric Authentication:** Optional BiometricPrompt (Fingerprint / Face Unlock) to unlock the app and reveal sensitive medical records.
- **Haptic & Sound Feedback:** Subtle haptic feedback when generating emergency OTPs or when high urgency is classified.

### 3.3 Features Intentionally Platform-Specific (Web-Only for Now)
- **Heavy Pharmacy Bulk Inventory CSV Importers:** Optimized for desktop keyboard/mouse workflows in the web portal.
- **Complex Admin Multi-Chart Analytics & Audit Table Exports:** Admin features are primary for desktop web browsers.

### 3.4 Features Not Yet Implemented on Android (Backlog)
- Offline-first Room Database caching for scanned prescriptions before network sync.
- BLE (Bluetooth Low Energy) beacon scanning for automatic pharmacy check-in.
