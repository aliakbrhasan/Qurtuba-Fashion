# دليل تشخيص مشكلة رفع الصور في تطبيق الكترون

## المشكلة
عند رفع صورة من نافذة إضافة فاتورة، الصورة لا تظهر في صفحة تفاصيل الفاتورة في تطبيق الكترون.

## الحل المطبق

### 1. إصلاح تدفق رفع الصور
- تم إصلاح `ImageService.uploadImage` لاستخدام `imageId` الصحيح من قاعدة البيانات
- تم إصلاح `ImageService.uploadToStorage` لتمرير المعاملات الصحيحة إلى IPC
- تم إصلاح `NewInvoiceDialogWithDB` لاستخدام المعاملات الصحيحة

### 2. إضافة تشخيص شامل
تم إضافة `console.log` statements في:
- `src/components/NewInvoiceDialogWithDB.tsx`
- `src/components/ui/ImageUpload.tsx`
- `src/services/image.service.ts`
- `electron/main.ts`
- `electron/local-database.ts`

## خطوات الاختبار

### 1. تشغيل التطبيق
```bash
npm run build:electron
npm run electron
```

### 2. اختبار رفع الصورة
1. افتح نافذة إضافة فاتورة جديدة
2. ارفع صورة للقماش
3. احفظ الفاتورة
4. افتح صفحة تفاصيل الفاتورة
5. تحقق من ظهور الصورة

### 3. مراقبة الـ Console Logs
ابحث عن هذه الرسائل في Developer Tools:

#### في نافذة إضافة الفاتورة:
```
NewInvoiceDialog - Invoice creation result: {id: "...", ...}
NewInvoiceDialog - Image upload debug: {hasFabricImage: true, hasFabricImageFile: true, invoiceId: "...", ...}
NewInvoiceDialog - Uploading image for invoice: [invoice-id]
ImageService.uploadImage called with: {file: File, entityType: 'invoice', entityId: '...'}
```

#### في Main Process:
```
Main process - Saving image to database: {entityType: 'invoice', entityId: '...', fileName: '...'}
Main process - Image saved to database with ID: [image-id]
```

#### في Local Database:
```
LocalDB.createImage called with: {entityType: 'invoice', entityId: '...', filename: '...'}
LocalDB.createImage - Image record created with ID: [image-id]
```

#### في صفحة تفاصيل الفاتورة:
```
InvoiceDetailsPage - Debug info: {invoiceId: '...', images: 1, imagesLoading: false, hasFabricImageUrl: false, fabricImageUrl: null}
ImageService.getEntityImages called with: {entityType: 'invoice', entityId: '...'}
API response: {ok: true, data: [{id: '...', filename: '...', data_url: '...', ...}]}
```

## المشاكل المحتملة والحلول

### 1. إذا لم تظهر الصورة
- تحقق من أن `invoiceId` موجود في logs
- تحقق من أن `ImageService.uploadImage` يتم استدعاؤها
- تحقق من أن `Main process - Image saved to database` يظهر

### 2. إذا ظهرت رسالة "Skipping image upload"
- تحقق من أن `result?.id` موجود
- تحقق من أن `fabricImage` و `fabricImageFile` موجودان

### 3. إذا فشل رفع الصورة
- تحقق من رسائل الخطأ في console
- تحقق من أن IPC handlers تعمل بشكل صحيح

## الملفات المعدلة

1. `src/services/image.service.ts` - إصلاح تدفق رفع الصور
2. `src/components/NewInvoiceDialogWithDB.tsx` - إصلاح استدعاء رفع الصور
3. `electron/main.ts` - إصلاح IPC handlers
4. `electron/local-database.ts` - إصلاح database operations
5. `electron/preload.ts` - إصلاح API exposure

## النتيجة المتوقعة
بعد تطبيق هذه الإصلاحات، يجب أن تظهر الصور المرفوعة من نافذة إضافة الفاتورة في صفحة تفاصيل الفاتورة في تطبيق الكترون.
