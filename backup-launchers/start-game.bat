@echo off
setlocal
set "TOOLS_DIR=%~dp0"
set "GAME_ROOT=%~dp0.."
cd /d "%GAME_ROOT%"

echo Starting Blind Glyph Demo...
echo.

where powershell >nul 2>nul
if not errorlevel 1 (
  echo [1/4] PowerShell local server...
  powershell -NoProfile -ExecutionPolicy Bypass -File "%TOOLS_DIR%start-server.ps1"
  if not errorlevel 1 goto :done
  echo PowerShell failed. Trying fallback.
  echo.
)

set "PYTHON_EXE="
for /f "delims=" %%P in ('where.exe python 2^>nul') do (
  echo %%P | find /i "\WindowsApps\python.exe" >nul
  if errorlevel 1 if not defined PYTHON_EXE set "PYTHON_EXE=%%P"
)
if defined PYTHON_EXE (
  echo [2/4] Python local server...
  "%PYTHON_EXE%" "%TOOLS_DIR%start-python-server.py"
  if not errorlevel 1 goto :done
  echo Python failed. Trying fallback.
  echo.
)

set "PYLAUNCHER_EXE="
for /f "delims=" %%P in ('where.exe py 2^>nul') do (
  echo %%P | find /i "\WindowsApps\py.exe" >nul
  if errorlevel 1 if not defined PYLAUNCHER_EXE set "PYLAUNCHER_EXE=%%P"
)
if defined PYLAUNCHER_EXE (
  echo [3/4] Python launcher...
  "%PYLAUNCHER_EXE%" -3 "%TOOLS_DIR%start-python-server.py"
  if not errorlevel 1 goto :done
  echo Python launcher failed. Trying fallback.
  echo.
)

where node >nul 2>nul
if not errorlevel 1 (
  echo [4/4] Node.js static server...
  node "%TOOLS_DIR%start-server.js"
  if not errorlevel 1 goto :done
  echo Node.js failed.
  echo.
)

echo All automatic start methods failed.
echo.
echo Manual options:
echo 1. Run backup-launchers\start-server.ps1 with PowerShell.
echo 2. If Python is installed, run:
echo    python backup-launchers\start-python-server.py
echo 3. Open the URL printed in the server window.
echo.
pause
exit /b 1

:done
exit /b 0
