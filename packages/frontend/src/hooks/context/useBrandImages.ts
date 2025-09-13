import { useState, useCallback } from 'react';
import { BrandImageApiService } from '../../lib/context/brand-image-api.service';
import type { BrandImage } from '@sansa-dev/shared';

export function useBrandImages(workspaceId: string) {
  const [images, setImages] = useState<BrandImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        setError(null);
        const newImage = await BrandImageApiService.uploadImage(
          workspaceId,
          file
        );
        setImages((prev) => [...prev, newImage]);
        return newImage;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload image';
        setError(errorMessage);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [workspaceId]
  );

  const deleteImage = useCallback(
    async (imageId: string) => {
      try {
        setError(null);
        await BrandImageApiService.deleteImage(workspaceId, imageId);
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete image';
        setError(errorMessage);
        throw err;
      }
    },
    [workspaceId]
  );

  const loadImages = useCallback(async () => {
    try {
      setError(null);
      const imageList = await BrandImageApiService.getImages(workspaceId);
      setImages(imageList);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load images';
      setError(errorMessage);
      throw err;
    }
  }, [workspaceId]);

  return { images, uploading, error, uploadImage, deleteImage, loadImages };
}
