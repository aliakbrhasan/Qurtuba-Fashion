@echo off
echo إصلاح مشكلة SQLite باستخدام better-sqlite3...

echo حذف sqlite3 العادي...
npm uninstall sqlite3

echo تثبيت better-sqlite3...
npm install better-sqlite3

echo إعادة بناء better-sqlite3 لـ Electron...
npx electron-rebuild -f -w better-sqlite3

echo إعادة بناء التطبيق...
npm run build:electron

echo تم الانتهاء من الإصلاح!
echo ملاحظة: قد تحتاج لتحديث الكود لاستخدام better-sqlite3 بدلاً من sqlite3
pause
