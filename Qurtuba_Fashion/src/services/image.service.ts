// Use IPC for storage; DB via Supabase client
import { supabase } from '@/db/client';

export interface ImageUploadResult { url: string; path: string; publicUrl: string }

export interface ImageRecord {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  data_url: string; // public URL
  thumbnail_url?: string;
  entity_type?: string;
  entity_id?: string;
  created_at: string;
}

export class ImageService {
  private static readonly BUCKET_NAME = 'invoice-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly MAX_DIMENSION = 4000; // pixels

  // Back-compat simple upload that only returns storage info
  static async uploadImage(file: File, entityOrFolder?: 'invoice' | 'customer' | 'order' | string, entityId?: string, options?: { maxWidth?: number; maxHeight?: number; quality?: number; createThumbnail?: boolean }): Promise<ImageUploadResult | ImageRecord> {
    // If only folder provided, return raw storage upload result
    if (entityId === undefined && (!entityOrFolder || typeof entityOrFolder === 'string' && !['invoice','customer','order'].includes(entityOrFolder))) {
      const folder = (entityOrFolder as string) || 'fabric-images';
      return await this.uploadToStorage(file, folder);
    }

    // Full flow: upload to storage, then insert DB record and return ImageRecord
    const entityType = (entityOrFolder as 'invoice'|'customer'|'order') || 'invoice';
    if (!entityId) throw new Error('entityId is required');

    // Optional compression
    let fileToUpload = file;
    if (options?.quality || options?.maxWidth || this.needsCompression(file)) {
      const quality = options?.quality ?? 0.85;
      const maxW = options?.maxWidth ?? 1600;
      fileToUpload = await this.compressImage(file, quality, maxW);
    }

    const folder = `${entityType}-images/${entityId}`;
    const storageRes = await this.uploadToStorage(fileToUpload, folder);

    // Thumbnail (optional)
    let thumbnailUrl: string | undefined = undefined;
    if (options?.createThumbnail) {
      thumbnailUrl = await this.createThumbnail(fileToUpload, 220);
    }

    // Insert DB row
    const { data, error } = await supabase
      .from('images')
      .insert({
        filename: storageRes.path,
        original_name: file.name,
        mime_type: file.type,
        size: file.size,
        data_url: storageRes.publicUrl,
        thumbnail_url: thumbnailUrl,
        entity_type: entityType,
        entity_id: entityId,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as ImageRecord;
  }

  // List entity images from DB
  static async getEntityImages(entityType: 'invoice'|'customer'|'order', entityId: string): Promise<ImageRecord[]> {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as ImageRecord[];
  }

  // Delete image: remove from storage then DB
  static async deleteImage(imageIdOrPath: string): Promise<void> {
    // Accept either image id (uuid) or storage path
    let filenamePath = imageIdOrPath;
    if (!imageIdOrPath.includes('/')) {
      const { data, error } = await supabase.from('images').select('filename').eq('id', imageIdOrPath).single();
      if (error) throw error;
      filenamePath = (data as any)?.filename;
    }
    const api = (window as any).electronAPI;
    const delRes = await api.images.delete(filenamePath);
    if (!delRes?.ok) throw new Error(delRes?.error || 'فشل في حذف الصورة');
    await supabase.from('images').delete().eq('filename', filenamePath);
  }

  // Move image between entities
  static async updateImageEntity(imageId: string, entityType: 'invoice'|'customer'|'order', newEntityId: string): Promise<void> {
    const { error } = await supabase
      .from('images')
      .update({ entity_type: entityType, entity_id: newEntityId })
      .eq('id', imageId);
    if (error) throw error;
  }

  // Get image URL (public)
  static async getImageUrl(path: string): Promise<string> {
    const api = (window as any).electronAPI;
    const res = await api.images.getPublicUrl(path);
    if (res?.ok) return res.data as string;
    throw new Error(res?.error || 'فشل في جلب رابط الصورة');
  }

  // Internal: upload to storage via IPC
  private static async uploadToStorage(file: File, folder: string): Promise<ImageUploadResult> {
    try {
      if (!this.validateFile(file)) throw new Error('نوع الملف غير مدعوم أو حجمه كبير جداً');
      const dimensions = await this.getImageDimensions(file);
      if (dimensions.width > this.MAX_DIMENSION || dimensions.height > this.MAX_DIMENSION) {
        throw new Error('أبعاد الصورة كبيرة جداً');
      }
      const timestamp = Date.now();
      const randomString = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const safeFolder = folder.replace(/[^a-zA-Z0-9-_\/]/g, '').slice(0, 128) || 'images';
      const fileName = `${safeFolder}/${timestamp}-${randomString}.${fileExtension}`;
      const buffer = await file.arrayBuffer();
      const api = (window as any).electronAPI;
      const res = await api.images.upload(Array.from(new Uint8Array(buffer)), file.type, fileName);
      if (!res?.ok) throw new Error(res?.error || 'فشل في رفع الصورة');
      return res.data as ImageUploadResult;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
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

  private static getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error('فشل في قراءة أبعاد الصورة'));
      img.src = URL.createObjectURL(file);
    });
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