@echo off
echo ===================================
echo    עורך כתוביות - Windows Builder
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js found:
node --version
echo.

REM Install dependencies
echo Installing dependencies...
npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Building Windows installer...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ===================================
echo Build completed successfully!
echo Installer is in: dist-electron\
echo ===================================
pause
