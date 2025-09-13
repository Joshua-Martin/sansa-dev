-- Migration: Fix Color Palette Migration
-- Description: Fixes the color_palettes migration by removing references to non-existent is_active column

-- =====================================================
-- COLOR PALETTES INDEX FIX
-- =====================================================

DO $$
BEGIN
    -- Check if color_palettes table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'color_palettes') THEN
        
        -- Drop the incorrect index that references is_active column (if it exists)
        DROP INDEX IF EXISTS idx_color_palettes_workspace_id_is_active;
        DROP INDEX IF EXISTS idx_color_palettes_project_id_is_active;
        
        -- Ensure correct indexes exist (without is_active column)
        CREATE INDEX IF NOT EXISTS idx_color_palettes_workspace_id ON color_palettes(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_color_palettes_workspace_id_created_at ON color_palettes(workspace_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_color_palettes_user_id ON color_palettes(user_id);

        RAISE NOTICE 'Color palettes index fix completed successfully';
        
    ELSE
        RAISE NOTICE 'color_palettes table does not exist, skipping fix';
    END IF;
END $$;
