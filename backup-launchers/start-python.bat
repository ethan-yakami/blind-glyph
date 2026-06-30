@echo off
setlocal
set "TOOLS_DIR=%~dp0"
set "GAME_ROOT=%~dp0.."
cd /d "%GAME_ROOT%"

echo Starting with Python fallback...
echo.

set "PYTHON_EXE="
for /f "delims=" %%P in ('where.exe python 2^>nul') do (
  echo %%P | find /i "\WindowsApps\python.exe" >nul
  if errorlevel 1 if not defined PYTHON_EXE set "PYTHON_EXE=%%P"
)
if defined PYTHON_EXE (
  "%PYTHON_EXE%" "%TOOLS_DIR%start-python-server.py"
  if not errorlevel 1 exit /b 0
)

set "PYLAUNCHER_EXE="
for /f "delims=" %%P in ('where.exe py 2^>nul') do (
  echo %%P | find /i "\WindowsApps\py.exe" >nul
  if errorlevel 1 if not defined PYLAUNCHER_EXE set "PYLAUNCHER_EXE=%%P"
)
if defined PYLAUNCHER_EXE (
  "%PYLAUNCHER_EXE%" -3 "%TOOLS_DIR%start-python-server.py"
  if not errorlevel 1 exit /b 0
)

echo Python fallback failed.
echo Please install Python 3, then run this file again.
echo Download: https://www.python.org/downloads/
echo.
pause
exit /b 1
