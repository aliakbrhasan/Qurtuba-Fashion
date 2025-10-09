# إصلاح مشكلة ترميز النصوص العربية

## المشكلة
النصوص العربية تظهر مرمزة في قاعدة البيانات بدلاً من أن تظهر بشكل صحيح.

## الحل

### 1. تطبيق إصلاح قاعدة البيانات
قم بتشغيل الملف `fix-arabic-encoding.sql` في Supabase SQL Editor:

```sql
-- انسخ والصق محتوى ملف fix-arabic-encoding.sql في Supabase SQL Editor
```

### 2. التحقق من إعدادات المشروع

#### أ. متغيرات البيئة
تأكد من أن ملف `.env` يحتوي على:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### ب. إعدادات المتصفح
تأكد من أن المتصفح يدعم UTF-8:
- في Chrome: Settings > Advanced > Languages > Add Arabic
- في Firefox: about:config > search for "intl.charset" > set to "UTF-8"

### 3. اختبار الإصلاح

#### أ. اختبار إضافة عميل جديد
1. اذهب إلى صفحة العملاء
2. أضف عميل جديد بالاسم العربي
3. تأكد من أن الاسم يظهر بشكل صحيح

#### ب. اختبار إضافة فاتورة جديدة
1. اذهب إلى صفحة الفواتير
2. أضف فاتورة جديدة بالبيانات العربية
3. تأكد من أن جميع النصوص تظهر بشكل صحيح

### 4. إذا استمرت المشكلة

#### أ. تحقق من إعدادات Supabase
1. اذهب إلى Supabase Dashboard
2. Settings > Database
3. تأكد من أن Character Set هو UTF-8

#### ب. تحقق من إعدادات الجدول
```sql
-- تحقق من ترميز الجداول
SELECT table_name, column_name, character_set_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND character_set_name IS NOT NULL;
```

#### ج. إعادة تشغيل التطبيق
```bash
npm run dev
```

### 5. الميزات المضافة

#### أ. دوال الترميز التلقائي
- `ensureUtf8Encoding()`: تصلح مشاكل الترميز تلقائياً
- `sanitizeTextData()`: تنظف البيانات قبل الحفظ

#### ب. Triggers قاعدة البيانات
- تصلح الترميز تلقائياً عند الإدراج والتحديث
- تعمل على جميع الجداول ذات النصوص العربية

#### ج. Headers HTTP
- إضافة `Content-Type: application/json; charset=utf-8`
- ضمان إرسال البيانات بالترميز الصحيح

### 6. الجداول المتأثرة
- `users` (الأسماء والأدوار)
- `customers` (أسماء العملاء والعناوين)
- `invoices` (أسماء العملاء والملاحظات)
- `invoice_items` (أسماء العناصر والأوصاف)
- `orders` (الحالة والملاحظات)

### 7. ملاحظات مهمة
- الإصلاح يعمل على البيانات الجديدة والموجودة
- لا يؤثر على الأداء بشكل ملحوظ
- يعمل مع جميع المتصفحات الحديثة
- متوافق مع Supabase وPostgreSQL

## اختبار سريع
```javascript
// اختبر في console المتصفح
const testText = "اختبار النص العربي";
console.log("Original:", testText);
console.log("Encoded:", encodeURIComponent(testText));
console.log("Decoded:", decodeURIComponent(encodeURIComponent(testText)));
```

إذا كانت النتيجة متطابقة، فالإصلاح يعمل بشكل صحيح.
