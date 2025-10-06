import { useState, useCallback } from 'react';
import { ProductOverviewApiService } from '../../lib/context/product-overview-api.service';
import type { ProductOverview } from '@sansa-dev/s-shared';

export function useProductOverview(workspaceId: string) {
  const [overview, setOverview] = useState<ProductOverview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveOverview = useCallback(
    async (content: string) => {
      try {
        setSaving(true);
        setError(null);
        let savedOverview: ProductOverview;
        if (overview) {
          savedOverview = await ProductOverviewApiService.updateOverview(
            workspaceId,
            content
          );
        } else {
          savedOverview = await ProductOverviewApiService.createOverview(
            workspaceId,
            content
          );
        }
        setOverview(savedOverview);
        return savedOverview;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to save product overview';
        setError(errorMessage);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [workspaceId, overview]
  );

  const loadOverview = useCallback(async () => {
    try {
      setError(null);
      const data = await ProductOverviewApiService.getOverview(workspaceId);
      setOverview(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load product overview';
      setError(errorMessage);
      throw err;
    }
  }, [workspaceId]);

  return { overview, saving, error, saveOverview, loadOverview };
}
