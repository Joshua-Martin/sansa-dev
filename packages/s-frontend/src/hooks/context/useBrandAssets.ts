import { useState, useCallback } from 'react';
import { BrandAssetApiService } from '../../lib/context/brand-asset-api.service';
import type { BrandAsset } from '@sansa-dev/s-shared';

export function useBrandAssets(workspaceId: string) {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAsset = useCallback(
    async (file: File, assetType: string) => {
      try {
        setUploading(true);
        setError(null);
        const newAsset = await BrandAssetApiService.uploadAsset(
          workspaceId,
          file,
          assetType
        );
        setAssets((prev) => [
          ...prev.filter((a) => a.assetType !== assetType),
          newAsset,
        ]);
        return newAsset;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to upload asset';
        setError(errorMessage);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [workspaceId]
  );

  const deleteAsset = useCallback(
    async (assetId: string) => {
      try {
        setError(null);
        await BrandAssetApiService.deleteAsset(workspaceId, assetId);
        setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete asset';
        setError(errorMessage);
        throw err;
      }
    },
    [workspaceId]
  );

  const loadAssets = useCallback(async () => {
    try {
      setError(null);
      const assetList = await BrandAssetApiService.getAssets(workspaceId);
      setAssets(assetList);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load assets';
      setError(errorMessage);
      throw err;
    }
  }, [workspaceId]);

  return { assets, uploading, error, uploadAsset, deleteAsset, loadAssets };
}
