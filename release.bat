@echo off
cd /d "%~dp0"

for /f "delims=" %%i in ('node -p "require('./package.json').version"') do set VERSION=%%i

echo.
echo Current version: v%VERSION%
echo.

git pull origin main
if %errorlevel% neq 0 (
    echo ERROR: git pull failed
    pause
    exit /b 1
)

git tag v%VERSION%
if %errorlevel% neq 0 (
    echo ERROR: Tag v%VERSION% already exists or failed
    pause
    exit /b 1
)

git push origin v%VERSION%
if %errorlevel% neq 0 (
    echo ERROR: git push tag failed
    pause
    exit /b 1
)

echo.
echo Successfully created and pushed tag v%VERSION%
echo GitHub Actions will now build the release.
echo.
pause
