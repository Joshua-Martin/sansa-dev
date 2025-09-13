import { useState, useEffect } from 'react';
import { ContextApiService } from '../../lib/context/context-api.service';
import type { Context } from '@sansa-dev/shared';

export function useContextData(workspaceId: string) {
  const [context, setContext] = useState<Context | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContext = async () => {
    try {
      setLoading(true);
      const data = await ContextApiService.getContext(workspaceId);
      setContext(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load context');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchContext();
    }
  }, [workspaceId]);

  return { context, loading, error, refetch: fetchContext };
}
