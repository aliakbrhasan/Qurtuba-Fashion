import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from './utils';

interface ImageUploadProps {
  onImageChange: (imageData: string | null, file: File | null) => void;
  currentImage?: string | null;
  className?: string;
  maxSize?: number; // in MB
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
}

export function ImageUpload({
  onImageChange,
  currentImage,
  className,
  maxSize = 2, // 2MB default
  maxWidth = 800,
  maxHeight = 600,
  quality = 0.8
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image optimization function
  const optimizeImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
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
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }, [maxWidth, maxHeight, quality]);

  // Handle file selection
  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setIsUploading(true);

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        throw new Error(`File size must be less than ${maxSize}MB`);
      }

      // Optimize image
      const optimizedImageData = await optimizeImage(file);
      
      // Call parent callback
      onImageChange(optimizedImageData, file);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsUploading(false);
    }
  }, [maxSize, optimizeImage, onImageChange]);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Remove image
  const removeImage = () => {
    onImageChange(null, null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          'border-2 border-dashed transition-colors cursor-pointer',
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          currentImage && 'border-green-300 bg-green-50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <CardContent className="p-6 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-600">Processing image...</p>
            </div>
          ) : currentImage ? (
            <div className="space-y-2">
              <img
                src={currentImage}
                alt="Uploaded"
                className="mx-auto max-h-32 max-w-full rounded-lg object-cover"
              />
              <p className="text-sm text-green-600">Image uploaded successfully</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to {maxSize}MB
                </p>
                <p className="text-xs text-gray-500">
                  Will be optimized to {maxWidth}x{maxHeight}px
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {currentImage && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openFileDialog}
            className="flex-1"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Change Image
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={removeImage}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}
