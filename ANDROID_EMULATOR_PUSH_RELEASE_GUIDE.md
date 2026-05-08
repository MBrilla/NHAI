# Android Emulator, Push, and Release APK Guide

This guide shows the exact workflow for this repo on Windows.

## 1) Open a terminal in project root

Project root:
C:\NHAIClone2

## 2) Start Android emulator

Use this to list available AVDs:

$emu = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
& $emu -list-avds

Start the AVD used in this project:

$emu = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
& $emu -avd "Medium_Phone_API_36.1"

## 3) Wait until emulator is fully booted

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb start-server
& $adb wait-for-device

do {
  $boot = (& $adb -s emulator-5554 shell getprop sys.boot_completed 2>$null).Trim()
  if (-not $boot) { $boot = '' }
} while ($boot -ne '1')

& $adb devices

You should see:
emulator-5554   device

## 4) Push latest fixes to emulator

From project root:

Set-Location C:\NHAIClone2
npm run android:push

This builds, installs, and launches the app on the emulator.

## 5) Build a release APK

Set-Location C:\NHAIClone2\android
.\gradlew.bat assembleRelease

Release APK output path:
C:\NHAIClone2\android\app\build\outputs\apk\release\app-release.apk

## 6) Quick one-liner flow (optional)

Set-Location C:\NHAIClone2; npm run android:push; Set-Location C:\NHAIClone2\android; .\gradlew.bat assembleRelease

## 7) Troubleshooting

No connected devices:

- Ensure emulator window is open.
- Run adb devices and confirm emulator-5554 is listed as device.
- If needed, restart adb:
  - & $adb kill-server
  - & $adb start-server

Emulator shows offline:

- Wait a bit longer for full boot.
- Re-run the boot wait loop above.

Build succeeds but app not visible:

- Re-run npm run android:push from C:\NHAIClone2.
- Check package launch step in terminal output.
