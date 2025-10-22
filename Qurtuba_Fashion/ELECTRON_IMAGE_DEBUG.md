# دليل تشخيص مشكلة الصور في تطبيق الإلكترون

## المشكلة المحددة
- ✅ الصور تعمل في نسخة المتصفح
- ❌ الصور لا تعمل في تطبيق الإلكترون

## التشخيص المضافة

### 1. في Main Process (electron/main.ts)
```javascript
// عند رفع صورة
console.log('Main process - Saving image to database:', {...});
console.log('Main process - Image saved to database with ID:', imageRecord.id);

// عند استرجاع الصور
console.log('Main process - image:getByEntity called with:', {...});
console.log('Main process - getImagesByEntity result:', result);
```

### 2. في LocalDatabase (electron/local-database.ts)
```javascript
// عند حفظ الصورة
console.log('LocalDatabase.createImage called with:', image);
console.log('LocalDatabase.createImage success:', row);

// عند استرجاع الصور
console.log('LocalDatabase.getImagesByEntity called with:', {...});
console.log('LocalDatabase.getImagesByEntity result:', result);
```

### 3. في Renderer Process (src/services/image.service.ts)
```javascript
// عند استرجاع الصور
console.log('ImageService.getEntityImages called with:', {...});
console.log('Electron API available:', !!api?.images?.getByEntity);
console.log('API response:', res);
console.log('Raw data from API:', res.data);
console.log('Converted images:', images);
```

### 4. في NewInvoiceDialogWithDB
```javascript
// عند رفع صورة
console.log('NewInvoiceDialog - onImageChange called with:', {...});
console.log('NewInvoiceDialog - Setting fabricImageFile:', {...});
console.log('NewInvoiceDialog - Image upload debug:', {...});
console.log('Uploading image for invoice:', result.id);
console.log('Image upload result:', uploaded);
```

## خطوات الاختبار

### 1. شغل تطبيق الإلكترون المبني
```bash
npm run build:electron
# ثم شغل التطبيق من dist-electron
```

### 2. مراقبة Console Logs
افتح Developer Tools (F12) في تطبيق الإلكترون ومراقب:

#### المتوقع عند رفع صورة من نافذة إضافة الفاتورة:
```
NewInvoiceDialog - onImageChange called with: {...}
NewInvoiceDialog - Setting fabricImageFile: {...}
NewInvoiceDialog - Image upload debug: {...}
Uploading image for invoice: [id]
Image upload result: {...}
Main process - Saving image to database: {...}
LocalDatabase.createImage called with: {...}
LocalDatabase.createImage success: {...}
Main process - Image saved to database with ID: [id]
```

#### المتوقع عند فتح صفحة التفاصيل:
```
ImageService.getEntityImages called with: {...}
Electron API available: true
Main process - image:getByEntity called with: {...}
LocalDatabase.getImagesByEntity called with: {...}
LocalDatabase.getImagesByEntity result: [...]
Main process - getImagesByEntity result: [...]
API response: {ok: true, data: [...]}
Raw data from API: [...]
Converted images: [...]
```

## المشاكل المحتملة والحلول

### 1. إذا لم يتم استدعاء createImage
**المشكلة:** `args.entityType` أو `args.entityId` مفقود
**الحل:** تحقق من أن `uploadImage` يمرر هذه القيم بشكل صحيح

### 2. إذا فشل createImage
**المشكلة:** خطأ في قاعدة البيانات
**الحل:** تحقق من console.error في LocalDatabase.createImage

### 3. إذا لم يتم استدعاء getImagesByEntity
**المشكلة:** IPC handler لا يعمل
**الحل:** تحقق من أن `image:getByEntity` handler موجود

### 4. إذا فشل getImagesByEntity
**المشكلة:** خطأ في استعلام قاعدة البيانات
**الحل:** تحقق من console.error في LocalDatabase.getImagesByEntity

### 5. إذا لم تظهر الصور رغم نجاح getImagesByEntity
**المشكلة:** مشكلة في تحويل البيانات أو عرضها
**الحل:** تحقق من "Converted images" في console

## الملفات المعدلة للتشخيص

1. `electron/main.ts` - إضافة console.log في IPC handlers
2. `electron/local-database.ts` - إضافة console.log في CRUD functions
3. `src/services/image.service.ts` - إضافة console.log في getEntityImages
4. `src/components/NewInvoiceDialogWithDB.tsx` - إضافة console.log في image upload
5. `src/components/ui/ImageUpload.tsx` - إضافة console.log في onImageChange

## إزالة Console Logs بعد الحل

بعد حل المشكلة، يمكن إزالة جميع console.log statements من:
- `electron/main.ts`
- `electron/local-database.ts`
- `src/services/image.service.ts`
- `src/components/NewInvoiceDialogWithDB.tsx`
- `src/components/ui/ImageUpload.tsx`

## ملاحظات مهمة

1. **التشخيص في Main Process:** console.log في main process ستظهر في terminal/console الذي شغل التطبيق منه
2. **التشخيص في Renderer Process:** console.log في renderer process ستظهر في Developer Tools
3. **تحقق من وجود جدول images:** يمكن فحص قاعدة البيانات المحلية للتأكد من وجود السجلات
4. **تحقق من مسار الملفات:** تأكد من أن الصور تُحفظ في `userData/images/`
