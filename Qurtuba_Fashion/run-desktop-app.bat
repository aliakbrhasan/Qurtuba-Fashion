@echo off
echo ========================================
echo    أزياء قرطبة - التطبيق المحلي
echo ========================================
echo.

echo تثبيت التبعيات...
call npm install

echo.
echo تشغيل التطبيق في وضع التطوير...
echo سيتم فتح التطبيق في نافذة منفصلة
echo.

call npm run electron:dev

pause
