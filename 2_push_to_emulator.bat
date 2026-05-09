@echo off
title Push to Emulator
echo Deploying latest code to the running emulator...
echo.

call npm run android:push

echo.
echo Deployment finished. Check the emulator!
pause
