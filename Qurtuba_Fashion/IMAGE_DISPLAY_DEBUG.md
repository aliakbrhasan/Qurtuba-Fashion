# دليل تشخيص مشكلة عرض الصور

## الحلول المطبقة

### 1. إضافة جدول `images` إلى قاعدة البيانات المحلية
- ✅ تم إضافة `LocalImage` interface
- ✅ تم إضافة جدول `images` في schema
- ✅ تم إضافة دوال CRUD للصور

### 2. تحديث IPC handlers
- ✅ تم تحديث `image:upload` لحفظ سجلات الصور
- ✅ تم إضافة `image:getByEntity` لاسترجاع الصور
- ✅ تم إضافة `image:deleteById` لحذف الصور

### 3. تحديث ImageService
- ✅ تم تعديل `getEntityImages()` لاستخدام API الجديد
- ✅ تم إضافة console.log للتشخيص

### 4. تحديث عرض الصور
- ✅ تم تحديث `InvoiceDetailsPage` للتحقق من كلا المصدرين:
  - الصور الجديدة من جدول `images`
  - الصور القديمة من `fabric_image_url`

## كيفية الاختبار

### 1. اختبار الصور القديمة (fabric_image_url)
1. افتح فاتورة موجودة لها صورة محفوظة في `fabric_image_url`
2. يجب أن تظهر الصورة في صفحة التفاصيل

### 2. اختبار الصور الجديدة (جدول images)
1. أنشئ فاتورة جديدة مع صورة
2. يجب أن تُحفظ الصورة في جدول `images` الجديد
3. يجب أن تظهر في صفحة التفاصيل

### 3. تشخيص المشاكل
افتح Developer Tools (F12) وتحقق من:

#### Console Logs المتوقعة:
```
ImageService.getEntityImages called with: {entityType: "invoice", entityId: "..."}
Electron API available: true
API response: {ok: true, data: [...]}
Converted images: [...]
```

#### إذا لم تظهر الصور:
1. تحقق من console logs
2. تحقق من وجود `fabric_image_url` في بيانات الفاتورة
3. تحقق من وجود سجلات في جدول `images`

## الملفات المعدلة

1. `electron/local-database.ts` - إضافة جدول images ودوال CRUD
2. `electron/main.ts` - تحديث IPC handlers
3. `electron/preload.ts` - إضافة API functions
4. `src/services/image.service.ts` - تحديث getEntityImages
5. `src/components/InvoiceDetailsPage.tsx` - تحديث منطق العرض
6. `src/components/NewInvoiceDialogWithDB.tsx` - إصلاح مشكلة items field

## ملاحظات مهمة

- الصور القديمة ستظهر من `fabric_image_url`
- الصور الجديدة ستظهر من جدول `images`
- النظام يدعم كلا المصدرين للتوافق مع الإصدارات السابقة
- تم إضافة console.log للتشخيص (يمكن إزالته لاحقاً)
