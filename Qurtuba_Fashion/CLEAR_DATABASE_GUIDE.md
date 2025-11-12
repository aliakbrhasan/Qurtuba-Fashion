# دليل تفريغ قاعدة البيانات

هذا الدليل يوضح كيفية تفريغ قاعدة بيانات تطبيق Electron من الفواتير والزبائن للاختبار.

## الطريقة 1: استخدام Console المتصفح (الأسهل)

1. **افتح التطبيق**
2. **افتح أدوات المطور**: اضغط `F12` أو `Ctrl+Shift+I` (Windows/Linux) أو `Cmd+Option+I` (Mac)
3. **اذهب إلى تبويب Console**
4. **اكتب الأمر التالي واضغط Enter:**

```javascript
window.electronAPI.local.clearAllData().then(result => {
  if (result.ok) {
    console.log('✅ تم تفريغ قاعدة البيانات بنجاح!');
    console.log('البيانات المحذوفة:', result.data.cleared);
    alert('تم تفريغ قاعدة البيانات بنجاح!\n' + 
          'زبائن: ' + result.data.cleared.customers + '\n' +
          'فواتير: ' + result.data.cleared.invoices + '\n' +
          'طلبات: ' + result.data.cleared.orders + '\n' +
          'عناصر فواتير: ' + result.data.cleared.invoiceItems);
    // إعادة تحميل الصفحة لتحديث البيانات
    window.location.reload();
  } else {
    console.error('❌ خطأ:', result.error);
    alert('حدث خطأ: ' + result.error);
  }
});
```

5. **بعد التنفيذ، ستحذف جميع الزبائن والفواتير والطلبات**
6. **حدّث الصفحة** (F5) لرؤية النتيجة

## الطريقة 2: استخدام سكريبت Node.js (متقدم)

يمكنك إنشاء ملف `clear-database.js` في المجلد الرئيسي:

```javascript
// clear-database.js
const Database = require('better-sqlite3');
const { app } = require('electron');
const { join } = require('path');

// ملاحظة: يجب تشغيل هذا من عملية Electron الرئيسية
// الأفضل استخدام الطريقة 1 أعلاه

const dbPath = join(app.getPath('userData'), 'qurtuba-local.db');
const db = new Database(dbPath);

console.log('جارٍ تفريغ قاعدة البيانات...');

db.exec(`
  DELETE FROM invoice_items;
  DELETE FROM orders;
  UPDATE invoices SET deleted = 1;
  UPDATE customers SET deleted = 1;
  DELETE FROM outbox WHERE table_name IN ('customers', 'invoices', 'orders');
`);

console.log('✅ تم تفريغ قاعدة البيانات بنجاح!');
db.close();
```

## ملاحظات مهمة

⚠️ **تحذير**: هذه العملية **لا يمكن التراجع عنها**!
- جميع البيانات المحذوفة لن تكون قابلة للاسترجاع
- تأكد من عمل نسخة احتياطية قبل التفريغ إذا كان لديك بيانات مهمة

✅ **بعد التفريغ**:
- جميع الإحصائيات ستصبح صفر
- ستظهر صفحات الزبائن والفواتير فارغة
- يمكنك البدء بإدخال بيانات جديدة للاختبار

## نسخ احتياطي قبل التفريغ (موصى به)

إذا كنت تريد عمل نسخة احتياطية قبل التفريغ:

```javascript
// في Console المتصفح:
window.electronAPI.local.exportAll().then(result => {
  if (result.ok) {
    const dataStr = JSON.stringify(result.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    console.log('✅ تم حفظ النسخة الاحتياطية!');
  }
});
```

## استعادة البيانات من النسخة الاحتياطية

```javascript
// بعد اختيار ملف النسخة الاحتياطية:
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const text = await file.text();
  const data = JSON.parse(text);
  
  const result = await window.electronAPI.local.importAll(data);
  if (result.ok) {
    alert('تم استعادة البيانات بنجاح!');
    window.location.reload();
  } else {
    alert('خطأ في الاستعادة: ' + result.error);
  }
};
fileInput.click();
```

---

**آخر تحديث**: الآن يمكنك تفريغ قاعدة البيانات بسهولة للاختبار! 🎉












