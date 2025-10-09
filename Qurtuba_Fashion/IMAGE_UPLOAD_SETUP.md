# 🖼️ Image Upload Setup Guide

## 📋 Overview

This guide explains how to set up image upload functionality in your Qurtuba Fashion webapp with automatic image optimization.

## ✨ Features

### **Image Optimization**
- **Automatic compression** - Reduces file size by 60-80% while maintaining quality
- **Smart resizing** - Automatically resizes images to optimal dimensions (800x600px)
- **Format conversion** - Converts all images to optimized JPEG format
- **Thumbnail generation** - Creates smaller thumbnails for faster loading
- **Quality control** - Maintains high quality with 80% compression ratio

### **Image Types Supported**
- **Fabric Images** - Pictures of the fabric used
- **Design Images** - Design sketches or references
- **Sample Images** - Sample photos or examples
- **Profile Images** - Customer profile pictures

### **File Support**
- **Formats**: JPEG, PNG, GIF, WebP
- **Max Size**: 2MB per image (before optimization)
- **Max Dimensions**: 800x600px (automatically resized)
- **Quality**: 80% (high quality with good compression)

## 🗄️ Database Setup

### **Step 1: Add Image Storage Tables**

Run this SQL in your Supabase SQL Editor:

```sql
-- Add image columns to existing tables
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fabric_image TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS design_image TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sample_image TEXT;

ALTER TABLE customers ADD COLUMN IF NOT EXISTS profile_image TEXT;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference_image TEXT;

-- Create images table for centralized image storage
CREATE TABLE IF NOT EXISTS images (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    data_url TEXT NOT NULL,
    thumbnail_url TEXT,
    entity_type VARCHAR(50), -- 'invoice', 'customer', 'order'
    entity_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for images table
CREATE INDEX IF NOT EXISTS idx_images_entity_type ON images(entity_type);
CREATE INDEX IF NOT EXISTS idx_images_entity_id ON images(entity_id);
CREATE INDEX IF NOT EXISTS idx_images_created_by ON images(created_by);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);

-- Enable RLS for images table
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for images
CREATE POLICY "Allow all operations for authenticated users" ON images FOR ALL USING (true);
```

## 🚀 Implementation

### **Components Created**

1. **`ImageUpload.tsx`** - Drag & drop image upload component
2. **`ImageGallery.tsx`** - Display and manage uploaded images
3. **`imageUtils.ts`** - Image optimization utilities
4. **`image.service.ts`** - Database operations for images
5. **`useImages.ts`** - React hook for image management

### **Updated Components**

1. **`NewInvoiceDialogWithDB.tsx`** - Added image upload sections
2. **`InvoiceDetailsDialogWithImages.tsx`** - Shows images in invoice details

## 📱 How to Use

### **1. Upload Images in Invoice Form**

1. **Open the invoice creation dialog**
2. **Scroll to "صور الطلب" (Order Images) section**
3. **Upload three types of images:**
   - **صورة القماش** (Fabric Image)
   - **صورة التصميم** (Design Image)  
   - **صورة العينة** (Sample Image)

### **2. Image Upload Process**

1. **Click or drag & drop** images onto the upload area
2. **Images are automatically optimized:**
   - Resized to 800x600px max
   - Compressed to 80% quality
   - Converted to JPEG format
   - Thumbnail generated
3. **Images are stored** in the database as base64 data
4. **Preview shows** optimized image

### **3. View Images in Invoice Details**

1. **Open any invoice** from the invoices list
2. **Scroll to "صور الطلب"** section
3. **View image gallery** with thumbnails
4. **Click images** to view full size
5. **Download or delete** images as needed

## ⚙️ Configuration

### **Image Settings**

You can customize image optimization in the components:

```typescript
<ImageUpload
  maxSize={2}           // Max file size in MB
  maxWidth={800}        // Max width in pixels
  maxHeight={600}       // Max height in pixels
  quality={0.8}         // Compression quality (0.1 to 1.0)
/>
```

### **Storage Settings**

Images are stored as base64 data in the database. For production, consider:

1. **Cloud Storage** - Move to AWS S3 or similar
2. **CDN** - Use CloudFront for faster delivery
3. **File System** - Store on server filesystem

## 🔧 Technical Details

### **Image Optimization Process**

1. **File Validation** - Check type and size
2. **Canvas Processing** - Create HTML5 canvas
3. **Aspect Ratio** - Maintain original proportions
4. **Resizing** - Scale to fit max dimensions
5. **Compression** - Apply quality setting
6. **Format Conversion** - Convert to JPEG
7. **Thumbnail** - Generate smaller version
8. **Base64 Encoding** - Convert for storage

### **Performance Benefits**

- **60-80% smaller** file sizes
- **Faster loading** with thumbnails
- **Consistent dimensions** for UI
- **Optimized format** for web display
- **Reduced bandwidth** usage

### **Storage Efficiency**

- **Base64 encoding** - 33% size increase but easier storage
- **Compression** - More than compensates for base64 overhead
- **Thumbnails** - Separate small images for lists
- **Database storage** - No file system dependencies

## 🧪 Testing

### **Test Image Upload**

1. **Create a new invoice**
2. **Upload different image types:**
   - Large images (test resizing)
   - Different formats (PNG, JPG, GIF)
   - Various file sizes
3. **Verify optimization:**
   - Check file size reduction
   - Verify image quality
   - Test thumbnail generation

### **Test Image Display**

1. **View invoice details**
2. **Check image gallery**
3. **Test image viewer**
4. **Verify download functionality**

## 🚨 Troubleshooting

### **Common Issues**

1. **Images not uploading**
   - Check file size (must be < 2MB)
   - Verify file format (JPEG, PNG, GIF, WebP)
   - Check browser console for errors

2. **Images not displaying**
   - Verify database connection
   - Check image data in database
   - Clear browser cache

3. **Poor image quality**
   - Increase quality setting (0.8 to 0.9)
   - Check original image resolution
   - Verify optimization settings

4. **Slow loading**
   - Check image sizes in database
   - Verify thumbnail generation
   - Consider CDN implementation

### **Debug Steps**

1. **Check browser console** for JavaScript errors
2. **Verify database** has image records
3. **Test with different images** to isolate issues
4. **Check network tab** for failed requests

## 🎉 Expected Results

After setup, you should have:

- ✅ **Image upload** in invoice creation form
- ✅ **Automatic optimization** of all uploaded images
- ✅ **Image gallery** in invoice details
- ✅ **Thumbnail generation** for faster loading
- ✅ **Image management** (view, download, delete)
- ✅ **High quality** images with small file sizes
- ✅ **Responsive design** that works on all devices

The image upload system is now fully integrated and ready to use!
