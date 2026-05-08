param(
  [string]$PackageName = 'com.mbrilla.nailscan'
)

$ErrorActionPreference = 'Stop'

Write-Host 'Building and installing Android release...'
Push-Location (Join-Path $PSScriptRoot '..\android')
try {
  .\gradlew installRelease
}
finally {
  Pop-Location
}

# Resolve adb from Android SDK in local.properties when adb is not on PATH.
$localPropertiesPath = Join-Path $PSScriptRoot '..\android\local.properties'
$adbCommand = 'adb'

if (Test-Path $localPropertiesPath) {
  $sdkLine = Get-Content $localPropertiesPath | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1
  if ($sdkLine) {
      $sdkDir = ($sdkLine -replace '^sdk\.dir=', '') -replace '\\:', ':' -replace '\\\\', '\'
    $candidateAdb = Join-Path $sdkDir 'platform-tools\adb.exe'
    if (Test-Path $candidateAdb) {
      $adbCommand = $candidateAdb
    }
  }
}

Write-Host 'Launching app on emulator...'
& $adbCommand shell monkey -p $PackageName -c android.intent.category.LAUNCHER 1
