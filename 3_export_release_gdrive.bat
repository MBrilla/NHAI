@echo off
setlocal
title Export Release APK to Google Drive

echo ========================================================
echo        NailScan AI - Production APK Exporter
echo ========================================================
echo.

echo [1/3] Building Release APK via Gradle...
cd android
call gradlew.bat assembleRelease
cd ..

if not exist "android\app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo [ERROR] Build failed! APK not found. Check the console output above.
    pause
    exit /b 1
)

echo.
echo [2/3] Generating Timestamp...
:: Get reliable timestamp using PowerShell (wmic is deprecated on Windows 11)
for /f "usebackq tokens=*" %%a in (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"`) do set timestamp=%%a

set APK_NAME=NailScan_v1.2_Production_%timestamp%.apk

echo.
echo [3/3] Exporting to Google Drive...

:: Define potential Google Drive paths
set GDRIVE_PATH_1=G:\My Drive\NailScan_Releases
set GDRIVE_PATH_2=%USERPROFILE%\Google Drive\NailScan_Releases
set GDRIVE_PATH_3=%USERPROFILE%\GoogleDrive\NailScan_Releases

:: Check which drive path exists (or can be created)
if exist "G:\My Drive\" (
    set EXPORT_PATH=%GDRIVE_PATH_1%
) else if exist "%USERPROFILE%\Google Drive\" (
    set EXPORT_PATH=%GDRIVE_PATH_2%
) else if exist "%USERPROFILE%\GoogleDrive\" (
    set EXPORT_PATH=%GDRIVE_PATH_3%
) else (
    echo [WARNING] Google Drive sync folder not found automatically!
    echo Falling back to local 'build_outputs' folder...
    set EXPORT_PATH=build_outputs\NailScan_Releases
)

if not exist "%EXPORT_PATH%" (
    mkdir "%EXPORT_PATH%"
)

copy "android\app\build\outputs\apk\release\app-release.apk" "%EXPORT_PATH%\%APK_NAME%"

echo.
echo ========================================================
echo                      SUCCESS!
echo ========================================================
echo Your production APK has been exported to:
echo %EXPORT_PATH%\%APK_NAME%
echo.
pause
