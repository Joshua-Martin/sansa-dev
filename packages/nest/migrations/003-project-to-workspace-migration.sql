-- Migration: Project to Workspace Migration
-- Description: Updates all context entities to use workspaceId instead of projectId
-- This migration handles the transition from project-based to workspace-based relationships

-- =====================================================
-- BRAND ASSETS TABLE MIGRATION
-- =====================================================

-- Add new workspace_id column (only if table exists and column doesn't exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_assets') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_assets' AND column_name = 'workspace_id') THEN
            ALTER TABLE brand_assets ADD COLUMN workspace_id UUID;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_assets' AND column_name = 'project_id') THEN
            UPDATE brand_assets
            SET workspace_id = project_id::UUID
            WHERE workspace_id IS NULL AND project_id IS NOT NULL;
        END IF;

        DROP INDEX IF EXISTS idx_brand_assets_project_id;
        DROP INDEX IF EXISTS idx_brand_assets_project_id_asset_type;
        DROP INDEX IF EXISTS idx_brand_assets_project_id_created_at;

        CREATE INDEX IF NOT EXISTS idx_brand_assets_workspace_id ON brand_assets(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_brand_assets_workspace_id_asset_type ON brand_assets(workspace_id, asset_type);
        CREATE INDEX IF NOT EXISTS idx_brand_assets_workspace_id_created_at ON brand_assets(workspace_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_brand_assets_user_id ON brand_assets(user_id);

        RAISE NOTICE 'Brand assets migration completed';
    ELSE
        RAISE NOTICE 'Brand assets table does not exist, skipping';
    END IF;
END $$;

-- =====================================================
-- BRAND IMAGES TABLE MIGRATION
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_images') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_images' AND column_name = 'workspace_id') THEN
            ALTER TABLE brand_images ADD COLUMN workspace_id UUID;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brand_images' AND column_name = 'project_id') THEN
            UPDATE brand_images
            SET workspace_id = project_id::UUID
            WHERE workspace_id IS NULL AND project_id IS NOT NULL;
        END IF;

        DROP INDEX IF EXISTS idx_brand_images_project_id;
        DROP INDEX IF EXISTS idx_brand_images_project_id_created_at;

        CREATE INDEX IF NOT EXISTS idx_brand_images_workspace_id ON brand_images(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_brand_images_workspace_id_created_at ON brand_images(workspace_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_brand_images_user_id ON brand_images(user_id);

        RAISE NOTICE 'Brand images migration completed';
    ELSE
        RAISE NOTICE 'Brand images table does not exist, skipping';
    END IF;
END $$;

-- =====================================================
-- COLOR PALETTES TABLE MIGRATION
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'color_palettes') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'color_palettes' AND column_name = 'workspace_id') THEN
            ALTER TABLE color_palettes ADD COLUMN workspace_id UUID;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'color_palettes' AND column_name = 'project_id') THEN
            UPDATE color_palettes
            SET workspace_id = project_id::UUID
            WHERE workspace_id IS NULL AND project_id IS NOT NULL;
        END IF;

        DROP INDEX IF EXISTS idx_color_palettes_project_id;
        DROP INDEX IF EXISTS idx_color_palettes_project_id_is_active;
        DROP INDEX IF EXISTS idx_color_palettes_project_id_created_at;

        CREATE INDEX IF NOT EXISTS idx_color_palettes_workspace_id ON color_palettes(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_color_palettes_workspace_id_created_at ON color_palettes(workspace_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_color_palettes_user_id ON color_palettes(user_id);

        RAISE NOTICE 'Color palettes migration completed';
    ELSE
        RAISE NOTICE 'Color palettes table does not exist, skipping';
    END IF;
END $$;

-- =====================================================
-- PRODUCT OVERVIEWS TABLE MIGRATION
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_overviews') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_overviews' AND column_name = 'workspace_id') THEN
            ALTER TABLE product_overviews ADD COLUMN workspace_id UUID;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_overviews' AND column_name = 'project_id') THEN
            UPDATE product_overviews
            SET workspace_id = project_id::UUID
            WHERE workspace_id IS NULL AND project_id IS NOT NULL;
        END IF;

        DROP INDEX IF EXISTS idx_product_overviews_project_id;
        DROP INDEX IF EXISTS idx_product_overviews_project_id_created_at;

        CREATE INDEX IF NOT EXISTS idx_product_overviews_workspace_id ON product_overviews(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_product_overviews_workspace_id_created_at ON product_overviews(workspace_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_product_overviews_user_id ON product_overviews(user_id);

        RAISE NOTICE 'Product overviews migration completed';
    ELSE
        RAISE NOTICE 'Product overviews table does not exist, skipping';
    END IF;
END $$;

-- =====================================================
-- LLM THREADS TABLE MIGRATION
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'llm_threads') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'llm_threads' AND column_name = 'workspace_id') THEN
            ALTER TABLE llm_threads ADD COLUMN workspace_id UUID;
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'llm_threads' AND column_name = 'project_id') THEN
            UPDATE llm_threads
            SET workspace_id = project_id::UUID
            WHERE workspace_id IS NULL AND project_id IS NOT NULL;
        END IF;

        DROP INDEX IF EXISTS idx_llm_threads_project_id_user_id_status;
        DROP INDEX IF EXISTS idx_llm_threads_project_id;

        CREATE INDEX IF NOT EXISTS idx_llm_threads_workspace_id_user_id_status ON llm_threads(workspace_id, user_id, status);
        CREATE INDEX IF NOT EXISTS idx_llm_threads_workspace_id ON llm_threads(workspace_id);
        CREATE INDEX IF NOT EXISTS idx_llm_threads_user_id ON llm_threads(user_id);
        CREATE INDEX IF NOT EXISTS idx_llm_threads_last_message_at ON llm_threads(last_message_at);

        RAISE NOTICE 'LLM threads migration completed';
    ELSE
        RAISE NOTICE 'LLM threads table does not exist, skipping';
    END IF;
END $$;

-- =====================================================
-- WORKSPACE SESSIONS TABLE MIGRATION
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspace_sessions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'project_id') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workspace_sessions' AND column_name = 'workspace_id') THEN
                ALTER TABLE workspace_sessions RENAME COLUMN project_id TO workspace_id;
                RAISE NOTICE 'Renamed project_id to workspace_id in workspace_sessions table';
            ELSE
                RAISE NOTICE 'workspace_id column already exists in workspace_sessions table, skipping rename';
            END IF;
        ELSE
            RAISE NOTICE 'project_id column does not exist in workspace_sessions table, skipping rename';
        END IF;
    ELSE
        RAISE NOTICE 'workspace_sessions table does not exist, skipping';
    END IF;
END $$;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE 'Project to workspace migration completed successfully!';
    RAISE NOTICE 'All context entities now use workspaceId instead of projectId';
END $$;
