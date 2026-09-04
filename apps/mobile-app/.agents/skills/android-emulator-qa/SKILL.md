---
name: android-emulator-qa
description: Manage Android emulator lifecycle, install APKs, run monkey/UI automation, inspect Logcat, and verify acceptance criteria.
---

# Android Emulator & QA Skill

## Emulator CLI Commands
- Check connected devices: `adb devices`
- Start emulator: `emulator -avd <avd_name> -no-audio -no-boot-anim -no-snapshot &`
- Wait for boot completion: `adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done'`
- Install APK: `adb install -r app/build/outputs/apk/debug/app-debug.apk`
- Launch app: `adb shell am start -n com.medisync.android/.MainActivity`
- Capture Logcat for crashes: `adb logcat -d -s "AndroidRuntime" "*:E"`
- Capture screenshot: `adb exec-out screencap -p > emulator_screen.png`

## QA Checklist
1. App boots without fatal crash or ANR.
2. Login screen accepts credentials and navigates smoothly.
3. Feature screens display proper loading spinners and error banners.
4. Back button / system gesture navigation handles backstack correctly.
