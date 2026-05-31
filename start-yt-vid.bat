@echo off
cd /d %~dp0
if exist ".tools\node\npm.cmd" (
  start "" cmd /k "set PATH=%CD%\.tools\node;%PATH% && npm run dev"
) else (
  start "" cmd /k "npm run dev"
)
