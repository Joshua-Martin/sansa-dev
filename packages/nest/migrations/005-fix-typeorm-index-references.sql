-- Migration: Fix TypeORM Index References
-- Description: Fixes TypeORM index mismatches where entity decorators reference 
-- non-existent properties. This migration doesn't change the database schema
-- but documents the fix that needs to be applied to the TypeORM entities.

-- =====================================================
-- TYPEORM INDEX REFERENCE FIXES
-- =====================================================

-- This migration documents the TypeORM entity fixes that resolve the following error:
-- "TypeORMError: Index contains column that is missing in the entity (BrandAsset): createdAt"

-- The issue occurs because some entities have @Index decorators that reference 
-- property names that don't exist in the entity class.

-- AFFECTED ENTITIES AND FIXES:
-- 1. BrandAsset entity: 
--    - Index decorator: @Index(['workspaceId', 'createdAt'])
--    - Actual property: uploadedAt (maps to database column 'created_at')
--    - Fix: Change index to @Index(['workspaceId', 'uploadedAt'])
--
-- 2. BrandImage entity:
--    - Index decorator: @Index(['workspaceId', 'createdAt']) 
--    - Actual property: uploadedAt (maps to database column 'created_at')
--    - Fix: Change index to @Index(['workspaceId', 'uploadedAt'])

-- The database indexes are already correctly created by previous migrations
-- and don't need to be changed. Only the TypeORM entity decorators need updating.

DO $$
BEGIN
    -- Verify that the database indexes exist as expected
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'brand_assets' 
        AND indexname = 'idx_brand_assets_workspace_id_created_at'
    ) THEN
        RAISE NOTICE 'Database index idx_brand_assets_workspace_id_created_at exists correctly';
    ELSE
        RAISE WARNING 'Database index idx_brand_assets_workspace_id_created_at is missing';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'brand_images' 
        AND indexname = 'idx_brand_images_workspace_id_created_at'
    ) THEN
        RAISE NOTICE 'Database index idx_brand_images_workspace_id_created_at exists correctly';
    ELSE
        RAISE WARNING 'Database index idx_brand_images_workspace_id_created_at is missing';
    END IF;

    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'TypeORM Index Reference Fix Migration Completed';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'This migration documents the entity decorator fixes needed.';
    RAISE NOTICE 'The actual TypeORM entity files must be updated separately.';
    RAISE NOTICE 'Database schema is already correct from previous migrations.';
END $$;
