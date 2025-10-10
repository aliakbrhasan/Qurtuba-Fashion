// Local-only: no Supabase DB usage

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
    // Touch to satisfy linter in local-only mode
    const _entityType = (entityOrFolder as 'invoice'|'customer'|'order') || 'invoice';
    const _entityIdSafe = String(entityId || 'unknown');

    // Optional compression
    let fileToUpload = file;
    if (options?.quality || options?.maxWidth || this.needsCompression(file)) {
      const quality = options?.quality ?? 0.85;
      const maxW = options?.maxWidth ?? 1600;
      fileToUpload = await this.compressImage(file, quality, maxW);
    }

    const folder = `${_entityType}-images/${_entityIdSafe}`;
    const storageRes = await this.uploadToStorage(fileToUpload, folder);

    // Thumbnail (optional)
    let thumbnailUrl: string | undefined = undefined;
    if (options?.createThumbnail) {
      thumbnailUrl = await this.createThumbnail(fileToUpload, 220);
    }

    // Local-only: synthesize an ImageRecord without DB row
    return {
      id: `${Date.now()}`,
      filename: storageRes.path,
      original_name: file.name,
      mime_type: file.type,
      size: file.size,
      data_url: storageRes.publicUrl,
      thumbnail_url: thumbnailUrl,
      entity_type: _entityType,
      entity_id: _entityIdSafe,
      created_at: new Date().toISOString(),
    } as ImageRecord;
  }

  // List entity images from DB
  static async getEntityImages(_entityType: 'invoice'|'customer'|'order', _entityId: string): Promise<ImageRecord[]> {
    // Local-only: no DB list, return empty
    return [];
  }

  // Delete image: remove from storage then DB
  static async deleteImage(imageIdOrPath: string): Promise<void> {
    // Accept either image id (uuid) or storage path
    let filenamePath = imageIdOrPath;
    // In local-only mode, assume provided value is a path
    const api = (typeof window !== 'undefined' ? (window as any).electronAPI : undefined);
    if (api?.images?.delete) {
      const delRes = await api.images.delete(filenamePath);
      if (!delRes?.ok) throw new Error(delRes?.error || 'فشل في حذف الصورة');
      // No DB row to delete in local-only mode
    } else {
      // Browser-only fallback: nothing to delete on disk; best-effort DB cleanup
      // No DB row to delete in local-only mode
    }
  }

  // Move image between entities
  static async updateImageEntity(_imageId: string, _entityType: 'invoice'|'customer'|'order', _newEntityId: string): Promise<void> {
    // Local-only: no DB update needed
    return;
  }

  // Get image URL (public)
  static async getImageUrl(path: string): Promise<string> {
    const api = (typeof window !== 'undefined' ? (window as any).electronAPI : undefined);
    if (api?.images?.getPublicUrl) {
      const res = await api.images.getPublicUrl(path);
      if (res?.ok) return res.data as string;
      throw new Error(res?.error || 'فشل في جلب رابط الصورة');
    }
    // Browser fallback: if path already a data URL or absolute URL, return as-is
    if (/^data:|^blob:|^https?:|^file:/i.test(path)) return path;
    return path;
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
      const randomString = (typeof crypto !== 'undefined' && (crypto as any).getRandomValues)
        ? (crypto.getRandomValues(new Uint32Array(1))[0].toString(36))
        : Math.random().toString(36).slice(2);
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const safeFolder = folder.replace(/[^a-zA-Z0-9-_\/]/g, '').slice(0, 128) || 'images';
      const fileName = `${safeFolder}/${timestamp}-${randomString}.${fileExtension}`;
      const api = (typeof window !== 'undefined' ? (window as any).electronAPI : undefined);
      if (api?.images?.upload) {
        const buffer = await file.arrayBuffer();
        const res = await api.images.upload(Array.from(new Uint8Array(buffer)), file.type, fileName);
        if (!res?.ok) throw new Error(res?.error || 'فشل في رفع الصورة');
        return res.data as ImageUploadResult;
      }
      // Browser fallback: embed as data URL so it persists in local DB
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
        reader.readAsDataURL(file);
      });
      return { url: `inline:${fileName}`, path: fileName, publicUrl: dataUrl };
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