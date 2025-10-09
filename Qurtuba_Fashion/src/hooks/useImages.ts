import { useState, useEffect } from 'react';
import { ImageService, ImageRecord } from '@/services/image.service';

export function useImages(entityType: 'invoice' | 'customer' | 'order', entityId?: string) {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch images for the entity
  const fetchImages = async () => {
    if (!entityId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const fetchedImages = await ImageService.getEntityImages(entityType, entityId);
      setImages(fetchedImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  // Upload a new image
  const uploadImage = async (file: File, options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    createThumbnail?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const uploadedImage = await ImageService.uploadImage(file, entityType, entityId, options);
      setImages(prev => [uploadedImage, ...prev]);
      return uploadedImage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete an image
  const deleteImage = async (imageId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await ImageService.deleteImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update image entity reference
  const updateImageEntity = async (imageId: string, newEntityId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await ImageService.updateImageEntity(imageId, entityType, newEntityId);
      // Refresh images after update
      await fetchImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update image');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch images when entityId changes
  useEffect(() => {
    if (entityId) {
      fetchImages();
    } else {
      setImages([]);
    }
  }, [entityType, entityId]);

  return {
    images,
    loading,
    error,
    fetchImages,
    uploadImage,
    deleteImage,
    updateImageEntity
  };
}
