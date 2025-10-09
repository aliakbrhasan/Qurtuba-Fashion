import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Badge } from './badge';
import { 
  Eye, 
  Download, 
  Trash2, 
  Image as ImageIcon, 
  Loader2,
  X
} from 'lucide-react';
import { cn } from './utils';
import { formatFileSize } from '@/utils/imageUtils';

interface ImageGalleryProps {
  images: Array<{
    id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    size: number;
    width?: number;
    height?: number;
    data_url: string;
    thumbnail_url?: string;
    created_at: string;
  }>;
  loading?: boolean;
  onDelete?: (imageId: string) => void;
  onDownload?: (imageId: string, filename: string) => void;
  className?: string;
  maxImages?: number;
  showThumbnails?: boolean;
}

export function ImageGallery({
  images,
  loading = false,
  onDelete,
  onDownload,
  className,
  maxImages = 6,
  showThumbnails = true
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsViewerOpen(true);
  };

  const handleDownload = (imageId: string, filename: string) => {
    if (onDownload) {
      onDownload(imageId, filename);
    } else {
      // Default download behavior
      const image = images.find(img => img.id === imageId);
      if (image) {
        const link = document.createElement('a');
        link.href = image.data_url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleDelete = (imageId: string) => {
    if (onDelete) {
      onDelete(imageId);
    }
  };

  const displayImages = images.slice(0, maxImages);
  const remainingCount = Math.max(0, images.length - maxImages);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading images...</span>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className={cn('text-center p-8 text-gray-500', className)}>
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No images uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
        {displayImages.map((image) => (
          <Card key={image.id} className="overflow-hidden group hover:shadow-md transition-shadow">
            <CardContent className="p-0">
              {/* Image */}
              <div 
                className="relative aspect-square cursor-pointer"
                onClick={() => handleImageClick(image.data_url)}
              >
                <img
                  src={showThumbnails && image.thumbnail_url ? image.thumbnail_url : image.data_url}
                  alt={image.original_name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(image.data_url);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image.id, image.original_name);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(image.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-3 space-y-2">
                <p className="text-sm font-medium text-gray-900 truncate" title={image.original_name}>
                  {image.original_name}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(image.size)}</span>
                  {image.width && image.height && (
                    <span>{image.width}×{image.height}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {image.mime_type.split('/')[1].toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {new Date(image.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Show remaining count */}
        {remainingCount > 0 && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square flex items-center justify-center bg-gray-100 text-gray-500">
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm font-medium">+{remainingCount}</p>
                  <p className="text-xs">more</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Image Viewer</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsViewerOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-0">
            {selectedImage && (
              <div className="text-center">
                <img
                  src={selectedImage}
                  alt="Full size"
                  className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
