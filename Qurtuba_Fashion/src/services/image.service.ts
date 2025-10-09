import { supabase } from '@/db/client';

export interface ImageUploadResult {
  url: string;
  path: string;
  publicUrl: string;
}

export class ImageService {
  private static readonly BUCKET_NAME = 'invoice-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // Upload image to Supabase Storage
  static async uploadImage(file: File, folder: string = 'fabric-images'): Promise<ImageUploadResult> {
    try {
      // Validate file
      if (!this.validateFile(file)) {
        throw new Error('نوع الملف غير مدعوم أو حجمه كبير جداً');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const fileName = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`فشل في رفع الصورة: ${error.message}`);
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        url: data.path,
        path: fileName,
        publicUrl: publicData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Delete image from Supabase Storage
  static async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([path]);

      if (error) {
        throw new Error(`فشل في حذف الصورة: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Get image URL
  static getImageUrl(path: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Validate file
  private static validateFile(file: File): boolean {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return false;
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return false;
    }

    return true;
  }

  // Compress image before upload
  static async compressImage(file: File, quality: number = 0.8, maxWidth: number = 1200): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('فشل في ضغط الصورة'));
            }
          }, 'image/jpeg', quality);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('فشل في تحميل الصورة'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Create thumbnail
  static async createThumbnail(file: File, size: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        try {
          canvas.width = size;
          canvas.height = size;

          ctx?.drawImage(img, 0, 0, size, size);
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(thumbnailUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('فشل في إنشاء الصورة المصغرة'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Get file size in human readable format
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if image needs compression
  static needsCompression(file: File): boolean {
    return file.size > 1024 * 1024; // 1MB
  }
}