import React, { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Upload, X, Crop, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';

interface ImageUploadWithCropProps {
  onImageSelect: (imageFile: File, imageUrl: string) => void;
  onImageRemove: () => void;
  selectedImage?: string;
  className?: string;
}

export function ImageUploadWithCrop({ 
  onImageSelect, 
  onImageRemove, 
  selectedImage,
  className = ""
}: ImageUploadWithCropProps) {
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string>('');
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          setOriginalImage(imageUrl);
          setIsCropDialogOpen(true);
        };
        reader.readAsDataURL(file);
      } else {
        alert('يرجى اختيار ملف صورة صالح');
      }
    }
  };

  const handleCropStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCropMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const newCropArea = {
      x: Math.min(dragStart.x, currentX),
      y: Math.min(dragStart.y, currentY),
      width: Math.abs(currentX - dragStart.x),
      height: Math.abs(currentY - dragStart.y)
    };
    
    setCropArea(newCropArea);
    drawCropArea();
  };

  const handleCropEnd = () => {
    setIsDragging(false);
  };

  const drawCropArea = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Draw crop area
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      
      // Draw overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clear crop area
      ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
      ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 
                   cropArea.x, cropArea.y, cropArea.width, cropArea.height);
    };
    img.src = originalImage;
  };

  const compressImage = (file: File, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1200px width)
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCropConfirm = async () => {
    if (!originalImage || cropArea.width === 0 || cropArea.height === 0) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = cropArea.width;
      canvas.height = cropArea.height;
      
      ctx?.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        0, 0, cropArea.width, cropArea.height
      );
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const croppedFile = new File([blob], 'cropped-image.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          // Compress the cropped image
          const compressedFile = await compressImage(croppedFile, 0.85);
          const imageUrl = URL.createObjectURL(compressedFile);
          
          onImageSelect(compressedFile, imageUrl);
          setIsCropDialogOpen(false);
          setOriginalImage('');
        }
      }, 'image/jpeg', 0.9);
    };
    
    img.src = originalImage;
  };

  const handleRemoveImage = () => {
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className={`border-2 border-dashed border-[#C69A72] rounded-lg p-6 text-center ${className}`}>
        {selectedImage ? (
          <div className="space-y-4">
            <img 
              src={selectedImage} 
              alt="صورة القماش" 
              className="max-w-full max-h-48 mx-auto rounded-lg object-cover"
            />
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCropDialogOpen(true)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
              >
                <Crop className="h-4 w-4 ml-2" />
                قص الصورة
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveImage}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 ml-2" />
                حذف الصورة
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-[#155446] mb-2" />
            <p className="text-[#155446] arabic-text">اضغط لرفع صورة القماش</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
            >
              اختيار صورة
            </Button>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Crop Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#F6E9CA] border-[#C69A72]">
          <DialogHeader>
            <DialogTitle className="text-[#13312A] arabic-text">قص الصورة</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-96 border border-[#C69A72] rounded-lg cursor-crosshair"
                onMouseDown={handleCropStart}
                onMouseMove={handleCropMove}
                onMouseUp={handleCropEnd}
                onMouseLeave={handleCropEnd}
              />
            </div>
            
            <div className="text-sm text-[#155446] arabic-text text-center">
              اسحب لاختيار المنطقة المراد قصها
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCropDialogOpen(false)}
                className="border-[#C69A72] text-[#13312A] hover:bg-[#C69A72]"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={handleCropConfirm}
                className="bg-[#155446] hover:bg-[#13312A] text-[#F6E9CA]"
              >
                <Download className="h-4 w-4 ml-2" />
                قص وحفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
