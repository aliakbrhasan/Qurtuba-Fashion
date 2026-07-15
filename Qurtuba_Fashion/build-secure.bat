@echo off
echo ====================================
echo Building with Code Protection
echo ====================================
echo.

set VITE_SECURE_BUILD=true
call npm run build -- --mode production
call node scripts/setup-assets.js
call node scripts/obfuscate-build.js

echo.
echo ====================================
echo Secure build complete!
echo ====================================
echo Your code is now protected in the 'build' folder
pause








