import { useState, useCallback } from 'react';
import { ColorPaletteApiService } from '../../lib/context/color-palette-api.service';
import type { ColorPalette } from '@sansa-dev/s-shared';

export function useColorPalette(workspaceId: string) {
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePalette = useCallback(
    async (colors: {
      name: string;
      primary: string;
      secondary: string;
      accent: string;
      neutral: string;
    }) => {
      try {
        setSaving(true);
        setError(null);
        let savedPalette: ColorPalette;
        if (palette) {
          savedPalette = await ColorPaletteApiService.updatePalette(
            workspaceId,
            colors
          );
        } else {
          savedPalette = await ColorPaletteApiService.createPalette(
            workspaceId,
            colors
          );
        }
        setPalette(savedPalette);
        return savedPalette;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to save color palette';
        setError(errorMessage);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [workspaceId, palette]
  );

  const loadPalette = useCallback(async () => {
    try {
      setError(null);
      const data = await ColorPaletteApiService.getPalette(workspaceId);
      setPalette(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load color palette';
      setError(errorMessage);
      throw err;
    }
  }, [workspaceId]);

  return { palette, saving, error, savePalette, loadPalette };
}
