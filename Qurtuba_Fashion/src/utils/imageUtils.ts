// Image utility functions for optimization and processing

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maxSize?: number; // in MB
}

export interface OptimizedImageResult {
  dataUrl: string;
  file: File;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: {
    width: number;
    height: number;
  };
}

/**
 * Optimize an image file with the given options
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8,
    format = 'jpeg',
    maxSize = 2
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const originalWidth = width;
        const originalHeight = height;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(maxWidth, width);
            height = width / aspectRatio;
          } else {
            height = Math.min(maxHeight, height);
            width = height * aspectRatio;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to optimized format
        const mimeType = `image/${format}`;
        const dataUrl = canvas.toDataURL(mimeType, quality);
        
        // Convert data URL to File
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const optimizedFile = new File([ab], file.name, { type: mimeString });
        
        // Calculate compression ratio
        const originalSize = file.size;
        const optimizedSize = optimizedFile.size;
        const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;

        resolve({
          dataUrl,
          file: optimizedFile,
          originalSize,
          optimizedSize,
          compressionRatio,
          dimensions: {
            width: Math.round(width),
            height: Math.round(height)
          }
        });

        // Clean up
        URL.revokeObjectURL(img.src);
      } catch (error) {
        reject(new Error('Failed to optimize image'));
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize image to fit within specified dimensions
 */
export function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = Math.min(maxWidth, width);
          height = width / aspectRatio;
        } else {
          height = Math.min(maxHeight, height);
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl);
      
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Convert image to base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions from file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(
  file: File,
  maxSize: number = 5, // MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): { isValid: boolean; error?: string } {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }

  // Check file size
  if (file.size > maxSize * 1024 * 1024) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSize}MB`
    };
  }

  return { isValid: true };
}

/**
 * Create thumbnail from image
 */
export function createThumbnail(
  file: File,
  size: number = 150,
  quality: number = 0.7
): Promise<string> {
  return resizeImage(file, size, size, quality);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get compression info for display
 */
export function getCompressionInfo(originalSize: number, optimizedSize: number) {
  const savedBytes = originalSize - optimizedSize;
  const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;
  
  return {
    savedBytes,
    compressionRatio: Math.round(compressionRatio),
    originalSizeFormatted: formatFileSize(originalSize),
    optimizedSizeFormatted: formatFileSize(optimizedSize),
    savedSizeFormatted: formatFileSize(savedBytes)
  };
}
