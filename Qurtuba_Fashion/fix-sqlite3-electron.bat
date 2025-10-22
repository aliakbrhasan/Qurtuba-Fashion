@echo off
echo إصلاح مشكلة SQLite3 في Electron...

echo حذف node_modules و package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo تثبيت التبعيات...
npm install

echo إعادة بناء SQLite3 لـ Electron...
npx electron-rebuild -f -w sqlite3

echo إعادة بناء SQLite3 مع إعدادات إضافية...
npm run rebuild:electron

echo إنشاء مجلد build إذا لم يكن موجوداً...
if not exist "node_modules\sqlite3\build" mkdir "node_modules\sqlite3\build"
if not exist "node_modules\sqlite3\build\Release" mkdir "node_modules\sqlite3\build\Release"

echo نسخ ملفات SQLite المطلوبة...
if exist "node_modules\sqlite3\build\Release\node_sqlite3.node" (
    echo تم العثور على node_sqlite3.node
) else (
    echo تحذير: لم يتم العثور على node_sqlite3.node
    echo محاولة إعادة بناء SQLite3...
    cd node_modules\sqlite3
    npm run install
    cd ..\..
)

echo إعادة بناء التطبيق...
npm run build:electron

echo تم الانتهاء من الإصلاح!
pause
