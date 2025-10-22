# دليل تشخيص مشكلة رفع الصور من نافذة إضافة الفاتورة

## المشكلة المحددة
- ✅ الصور تظهر عند رفعها من صفحة تفاصيل الفاتورة
- ❌ الصور لا تظهر عند رفعها من نافذة إضافة الفاتورة

## التشخيص المضافة

### 1. Console Logs في NewInvoiceDialogWithDB
```javascript
// عند رفع صورة
console.log('NewInvoiceDialog - onImageChange called with:', {...});

// عند إنشاء الفاتورة
console.log('NewInvoiceDialog - Image upload debug:', {...});
console.log('Uploading image for invoice:', result.id);
console.log('Image upload result:', uploaded);
```

### 2. Console Logs في ImageUpload Component
```javascript
console.log('ImageUpload - Calling onImageChange with:', {...});
```

### 3. Console Logs في ImageService
```javascript
console.log('ImageService.getEntityImages called with:', {...});
console.log('Electron API available:', !!api?.images?.getByEntity);
console.log('API response:', res);
```

## خطوات الاختبار

### 1. اختبار رفع الصورة من نافذة إضافة الفاتورة
1. افتح التطبيق المبني
2. اضغط "إضافة فاتورة جديدة"
3. ارفع صورة في قسم "صورة القماش"
4. املأ البيانات المطلوبة
5. احفظ الفاتورة
6. افتح صفحة تفاصيل الفاتورة

### 2. مراقبة Console Logs
افتح Developer Tools (F12) وتحقق من:

#### المتوقع عند رفع الصورة:
```
ImageUpload - Calling onImageChange with: {imageData: "data available", file: {...}}
NewInvoiceDialog - onImageChange called with: {imageData: "data available", file: {...}}
NewInvoiceDialog - Setting fabricImageFile: {name: "fabric.jpg", size: ..., type: "image/jpeg"}
```

#### المتوقع عند حفظ الفاتورة:
```
NewInvoiceDialog - Image upload debug: {hasFabricImage: true, hasFabricImageFile: true, invoiceId: "..."}
Uploading image for invoice: [invoice-id]
Image upload result: {url: "...", path: "...", publicUrl: "..."}
Updating invoice with image URL: [url]
```

#### المتوقع عند فتح صفحة التفاصيل:
```
ImageService.getEntityImages called with: {entityType: "invoice", entityId: "..."}
Electron API available: true
API response: {ok: true, data: [...]}
Converted images: [...]
```

## المشاكل المحتملة والحلول

### 1. إذا لم يتم استدعاء onImageChange
**المشكلة:** `ImageUpload` component لا يعمل
**الحل:** تحقق من أن الملف تم رفعه بنجاح

### 2. إذا تم استدعاء onImageChange لكن fabricImageFile = null
**المشكلة:** مشكلة في معالجة الملف
**الحل:** تحقق من نوع الملف وحجمه

### 3. إذا تم رفع الصورة لكن لا تظهر في التفاصيل
**المشكلة:** مشكلة في حفظ الصورة في قاعدة البيانات
**الحل:** تحقق من console logs في ImageService

### 4. إذا ظهرت رسالة "Skipping image upload"
**المشكلة:** `fabricImage` أو `fabricImageFile` أو `result.id` مفقود
**الحل:** تحقق من قيم هذه المتغيرات

## الملفات المعدلة للتشخيص

1. `src/components/NewInvoiceDialogWithDB.tsx` - إضافة console.log للتشخيص
2. `src/components/ui/ImageUpload.tsx` - إضافة console.log للتشخيص  
3. `src/services/image.service.ts` - إضافة console.log للتشخيص
4. `src/components/InvoiceDetailsPage.tsx` - إضافة console.log للتشخيص

## إزالة Console Logs بعد الحل

بعد حل المشكلة، يمكن إزالة جميع console.log statements من:
- `NewInvoiceDialogWithDB.tsx`
- `ImageUpload.tsx` 
- `image.service.ts`
- `InvoiceDetailsPage.tsx`

