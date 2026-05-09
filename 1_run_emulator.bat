@echo off
title Start Android Emulator
echo Starting Android Emulator (Medium_Phone_API_36.1)...
echo Please wait for the emulator window to appear.

:: Start emulator in background
start "" "%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe" -avd Medium_Phone_API_36.1 -no-snapshot-load

echo.
echo Emulator launch command sent. You can close this window once the emulator starts booting.
pause
