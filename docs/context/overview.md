# x21 Context Management System - MVP Implementation Overview

## Definition and Purpose

In the x21 App ecosystem, **context** refers to the essential brand and design data provided by users to inform the AI web design generation process. This context serves as the foundational information that enables the system to create websites aligned with the user's brand identity and product positioning.

The context management system enables users to:

- Upload brand board images for visual inspiration
- Manage brand assets (logos, wordmarks, icons)
- Define color palettes for brand consistency
- Provide product/service descriptions for content generation

## System Architecture Overview

The context management system follows a simplified, MVP-focused architecture:

### Frontend Components

- **Context UI Components**: React components for managing brand data
- **File Upload**: Basic file upload with progress tracking
- **State Management**: Integration with existing stores

### Backend Services

- **RESTful APIs**: CRUD operations for context data
- **File Storage**: Direct storage integration (no abstraction layer)
- **Database Layer**: PostgreSQL entities with user-based security
- **JWT Authentication**: Standard authentication with project-level authorization

### Security Model

- **Project-Based Authorization**: All operations require valid workspaceId + JWT
- **Double Ownership Verification**: Verify user owns project AND context items
- **User Isolation**: Complete data separation between users

---

## Frontend Implementation - SIMPLIFIED MVP APPROACH

### Context Tab in Builder Header

The builder page will have a simple "Context" tab alongside the existing "Preview" tab.

**Modified File**: `packages/frontend/src/app/(app)/builder/page.tsx`

- Add "Context" tab to the header navigation
- Use localStorage to persist tab selection
- Render `ContextManager` component when Context tab is active

### Context Manager Interface

A simple tabbed interface with 4 sections:

#### 1. Brand Board (Images)

- **4 Image Boxes**: Simple grid of 4 clickable/upload areas
- **Empty State**: Show upload icon/placeholder when no image
- **Filled State**: Display uploaded image with remove option
- **Click to Upload**: Each box opens file picker on click
- **No Drag & Drop**: Keep it simple, just click to upload

#### 2. Brand Assets

- **Asset Types**: Logo, Wordmark, Icon upload areas
- **Simple Upload**: Click to upload for each asset type
- **Asset Display**: Show uploaded asset with type label
- **Replace/Delete**: Option to replace or remove each asset

#### 3. Theme (Colors)

- **4 Color Divs**: Primary, Secondary, Accent, Neutral
- **Click to Pick**: Each div opens a color picker on click
- **Hex Display**: Show hex value below each color
- **No Advanced Features**: Just basic color selection

#### 4. Product Description

- **Simple Text Field**: Large textarea for product description
- **Auto-save**: Save on blur or after 2 seconds of inactivity
- **Character Count**: Show character count (optional)
- **No Rich Text**: Keep it simple with plain text

### Frontend Architecture - Strong Separation of Concerns

#### API Services (`packages/frontend/src/lib/context/`)

Each context function gets its own API service file using the existing `@api.ts`:

**`context-api.service.ts`** - Main context operations:

```typescript
// packages/frontend/src/lib/context/context-api.service.ts
import { api } from '../api';
import type { Context, ContextSummary } from '@sansa-dev/shared';

export class ContextApiService {
  static async getContext(workspaceId: string): Promise<Context> {
    return api.get<Context>(`/context/${workspaceId}`);
  }

  static async getContextSummary(workspaceId: string): Promise<ContextSummary> {
    return api.get<ContextSummary>(`/context/${workspaceId}/summary`);
  }

  static async deleteContext(workspaceId: string): Promise<void> {
    return api.delete<void>(`/context/${workspaceId}`);
  }
}
```

**`brand-image-api.service.ts`** - Brand board image operations:

```typescript
// packages/frontend/src/lib/context/brand-image-api.service.ts
import { api } from '../api';
import type { BrandImage } from '@sansa-dev/shared';

export class BrandImageApiService {
  static async uploadImage(
    workspaceId: string,
    file: File
  ): Promise<BrandImage> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<BrandImage>(
      `/brand-images/${workspaceId}/upload`,
      formData
    );
  }

  static async getImages(workspaceId: string): Promise<BrandImage[]> {
    return api.get<BrandImage[]>(`/brand-images/${workspaceId}`);
  }

  static async deleteImage(
    workspaceId: string,
    imageId: string
  ): Promise<void> {
    return api.delete<void>(`/brand-images/${workspaceId}/${imageId}`);
  }
}
```

**`brand-asset-api.service.ts`** - Brand asset operations:

```typescript
// packages/frontend/src/lib/context/brand-asset-api.service.ts
import { api } from '../api';
import type { BrandAsset } from '@sansa-dev/shared';

export class BrandAssetApiService {
  static async uploadAsset(
    workspaceId: string,
    file: File,
    assetType: string
  ): Promise<BrandAsset> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);
    return api.post<BrandAsset>(
      `/brand-assets/${workspaceId}/upload`,
      formData
    );
  }

  static async getAssets(workspaceId: string): Promise<BrandAsset[]> {
    return api.get<BrandAsset[]>(`/brand-assets/${workspaceId}`);
  }

  static async deleteAsset(
    workspaceId: string,
    assetId: string
  ): Promise<void> {
    return api.delete<void>(`/brand-assets/${workspaceId}/${assetId}`);
  }
}
```

**`color-palette-api.service.ts`** - Color palette operations:

```typescript
// packages/frontend/src/lib/context/color-palette-api.service.ts
import { api } from '../api';
import type { ColorPalette } from '@sansa-dev/shared';

export class ColorPaletteApiService {
  static async createPalette(
    workspaceId: string,
    data: any
  ): Promise<ColorPalette> {
    return api.post<ColorPalette>(`/color-palette/${workspaceId}`, data);
  }

  static async getPalette(workspaceId: string): Promise<ColorPalette | null> {
    return api.get<ColorPalette>(`/color-palette/${workspaceId}`);
  }

  static async updatePalette(
    workspaceId: string,
    data: any
  ): Promise<ColorPalette> {
    return api.put<ColorPalette>(`/color-palette/${workspaceId}`, data);
  }

  static async deletePalette(workspaceId: string): Promise<void> {
    return api.delete<void>(`/color-palette/${workspaceId}`);
  }
}
```

**`product-overview-api.service.ts`** - Product overview operations:

```typescript
// packages/frontend/src/lib/context/product-overview-api.service.ts
import { api } from '../api';
import type { ProductOverview } from '@sansa-dev/shared';

export class ProductOverviewApiService {
  static async createOverview(
    workspaceId: string,
    content: string
  ): Promise<ProductOverview> {
    return api.post<ProductOverview>(`/product-overview/${workspaceId}`, {
      content,
    });
  }

  static async getOverview(
    workspaceId: string
  ): Promise<ProductOverview | null> {
    return api.get<ProductOverview>(`/product-overview/${workspaceId}`);
  }

  static async updateOverview(
    workspaceId: string,
    content: string
  ): Promise<ProductOverview> {
    return api.put<ProductOverview>(`/product-overview/${workspaceId}`, {
      content,
    });
  }

  static async deleteOverview(workspaceId: string): Promise<void> {
    return api.delete<void>(`/product-overview/${workspaceId}`);
  }
}
```

#### React Hooks (`packages/frontend/src/hooks/`)

**`useContextData.ts`** - Main context management:

```typescript
// packages/frontend/src/hooks/useContextData.ts
import { useState, useEffect } from 'react';
import { ContextApiService } from '../lib/context/context-api.service';
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
```

**`useBrandImages.ts`** - Brand board image management:

```typescript
// packages/frontend/src/hooks/useBrandImages.ts
import { useState, useCallback } from 'react';
import { BrandImageApiService } from '../lib/context/brand-image-api.service';
import type { BrandImage } from '@sansa-dev/shared';

export function useBrandImages(workspaceId: string) {
  const [images, setImages] = useState<BrandImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadImage = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        const newImage = await BrandImageApiService.uploadImage(
          workspaceId,
          file
        );
        setImages((prev) => [...prev, newImage]);
        return newImage;
      } catch (error) {
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [workspaceId]
  );

  const deleteImage = useCallback(
    async (imageId: string) => {
      await BrandImageApiService.deleteImage(workspaceId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    },
    [workspaceId]
  );

  const loadImages = useCallback(async () => {
    const imageList = await BrandImageApiService.getImages(workspaceId);
    setImages(imageList);
  }, [workspaceId]);

  return { images, uploading, uploadImage, deleteImage, loadImages };
}
```

**`useBrandAssets.ts`** - Brand asset management:

```typescript
// packages/frontend/src/hooks/useBrandAssets.ts
import { useState, useCallback } from 'react';
import { BrandAssetApiService } from '../lib/context/brand-asset-api.service';
import type { BrandAsset } from '@sansa-dev/shared';

export function useBrandAssets(workspaceId: string) {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [uploading, setUploading] = useState(false);

  const uploadAsset = useCallback(
    async (file: File, assetType: string) => {
      try {
        setUploading(true);
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
      } catch (error) {
        throw error;
      } finally {
        setUploading(false);
      }
    },
    [workspaceId]
  );

  const deleteAsset = useCallback(
    async (assetId: string) => {
      await BrandAssetApiService.deleteAsset(workspaceId, assetId);
      setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
    },
    [workspaceId]
  );

  const loadAssets = useCallback(async () => {
    const assetList = await BrandAssetApiService.getAssets(workspaceId);
    setAssets(assetList);
  }, [workspaceId]);

  return { assets, uploading, uploadAsset, deleteAsset, loadAssets };
}
```

**`useColorPalette.ts`** - Color palette management:

```typescript
// packages/frontend/src/hooks/useColorPalette.ts
import { useState, useCallback } from 'react';
import { ColorPaletteApiService } from '../lib/context/color-palette-api.service';
import type { ColorPalette } from '@sansa-dev/shared';

export function useColorPalette(workspaceId: string) {
  const [palette, setPalette] = useState<ColorPalette | null>(null);
  const [saving, setSaving] = useState(false);

  const savePalette = useCallback(
    async (colors: any) => {
      try {
        setSaving(true);
        let savedPalette;
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
      } catch (error) {
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [workspaceId, palette]
  );

  const loadPalette = useCallback(async () => {
    const data = await ColorPaletteApiService.getPalette(workspaceId);
    setPalette(data);
  }, [workspaceId]);

  return { palette, saving, savePalette, loadPalette };
}
```

**`useProductOverview.ts`** - Product overview management:

```typescript
// packages/frontend/src/hooks/useProductOverview.ts
import { useState, useCallback } from 'react';
import { ProductOverviewApiService } from '../lib/context/product-overview-api.service';
import type { ProductOverview } from '@sansa-dev/shared';

export function useProductOverview(workspaceId: string) {
  const [overview, setOverview] = useState<ProductOverview | null>(null);
  const [saving, setSaving] = useState(false);

  const saveOverview = useCallback(
    async (content: string) => {
      try {
        setSaving(true);
        let savedOverview;
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
      } catch (error) {
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [workspaceId, overview]
  );

  const loadOverview = useCallback(async () => {
    const data = await ProductOverviewApiService.getOverview(workspaceId);
    setOverview(data);
  }, [workspaceId]);

  return { overview, saving, saveOverview, loadOverview };
}
```

#### React Components (`packages/frontend/src/components/context/`)

**`ContextManager.tsx`** - Main context interface:

```typescript
// packages/frontend/src/components/context/ContextManager.tsx
import { useState } from 'react';
import { BrandBoard } from './BrandBoard';
import { BrandAssets } from './BrandAssets';
import { ThemeColors } from './ThemeColors';
import { ProductDescription } from './ProductDescription';

type TabType = 'brand-board' | 'brand-assets' | 'theme' | 'product';

export function ContextManager({ workspaceId }: { workspaceId: string }) {
  const [activeTab, setActiveTab] = useState<TabType>('brand-board');

  const tabs = [
    { id: 'brand-board', label: 'Brand Board', component: BrandBoard },
    { id: 'brand-assets', label: 'Brand Assets', component: BrandAssets },
    { id: 'theme', label: 'Theme', component: ThemeColors },
    { id: 'product', label: 'Product', component: ProductDescription },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6">
        {ActiveComponent && <ActiveComponent workspaceId={workspaceId} />}
      </div>
    </div>
  );
}
```

**`BrandBoard.tsx`** - 4 image upload boxes:

```typescript
// packages/frontend/src/components/context/BrandBoard.tsx
import { useBrandImages } from '../../hooks/useBrandImages';

export function BrandBoard({ workspaceId }: { workspaceId: string }) {
  const { images, uploading, uploadImage, deleteImage, loadImages } = useBrandImages(workspaceId);

  const handleFileUpload = async (index: number, file: File) => {
    try {
      await uploadImage(file);
      await loadImages(); // Refresh the list
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const getImageForIndex = (index: number) => {
    return images[index] || null;
  };

  return (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      {[0, 1, 2, 3].map(index => {
        const image = getImageForIndex(index);
        return (
          <div
            key={index}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileUpload(index, file);
              };
              input.click();
            }}
          >
            {image ? (
              <div className="relative w-full h-full">
                <img
                  src={image.url}
                  alt={image.filename}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteImage(image.id);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-2xl text-gray-400 mb-2">+</div>
                <div className="text-sm text-gray-500">Upload Image</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

**`ThemeColors.tsx`** - 4 color picker divs:

```typescript
// packages/frontend/src/components/context/ThemeColors.tsx
import { useState } from 'react';
import { useColorPalette } from '../../hooks/useColorPalette';

export function ThemeColors({ workspaceId }: { workspaceId: string }) {
  const { palette, saving, savePalette, loadPalette } = useColorPalette(workspaceId);
  const [colors, setColors] = useState({
    primary: palette?.colors?.find(c => c.role === 'primary')?.hex || '#3B82F6',
    secondary: palette?.colors?.find(c => c.role === 'secondary')?.hex || '#6B7280',
    accent: palette?.colors?.find(c => c.role === 'accent')?.hex || '#10B981',
    neutral: palette?.colors?.find(c => c.role === 'neutral')?.hex || '#F3F4F6',
  });

  const handleColorChange = async (role: string, hex: string) => {
    const newColors = { ...colors, [role]: hex };
    setColors(newColors);

    try {
      await savePalette({
        name: 'Brand Colors',
        primary: newColors.primary,
        secondary: newColors.secondary,
        accent: newColors.accent,
        neutral: newColors.neutral,
      });
    } catch (error) {
      console.error('Failed to save colors:', error);
    }
  };

  const colorOptions = [
    { role: 'primary', label: 'Primary', defaultColor: '#3B82F6' },
    { role: 'secondary', label: 'Secondary', defaultColor: '#6B7280' },
    { role: 'accent', label: 'Accent', defaultColor: '#10B981' },
    { role: 'neutral', label: 'Neutral', defaultColor: '#F3F4F6' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      {colorOptions.map(({ role, label, defaultColor }) => (
        <div key={role} className="space-y-2">
          <label className="text-sm font-medium">{label}</label>
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
              style={{ backgroundColor: colors[role as keyof typeof colors] }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = colors[role as keyof typeof colors];
                input.onchange = (e) => {
                  handleColorChange(role, (e.target as HTMLInputElement).value);
                };
                input.click();
              }}
            />
            <span className="text-sm font-mono">
              {colors[role as keyof typeof colors]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**`ProductDescription.tsx`** - Simple text field:

```typescript
// packages/frontend/src/components/context/ProductDescription.tsx
import { useState, useEffect } from 'react';
import { useProductOverview } from '../../hooks/useProductOverview';

export function ProductDescription({ workspaceId }: { workspaceId: string }) {
  const { overview, saving, saveOverview, loadOverview } = useProductOverview(workspaceId);
  const [content, setContent] = useState(overview?.content || '');
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (overview?.content) {
      setContent(overview.content);
    }
  }, [overview]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);

    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // Set new timeout for auto-save
    const timeout = setTimeout(async () => {
      try {
        await saveOverview(newContent);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 2000);

    setAutoSaveTimeout(timeout);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Product Description
        </label>
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Describe your product or service..."
          className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {content.length} characters
        </span>
        {saving && (
          <span className="text-sm text-blue-600">Saving...</span>
        )}
      </div>
    </div>
  );
}
```

**`BrandAssets.tsx`** - Asset upload areas:

```typescript
// packages/frontend/src/components/context/BrandAssets.tsx
import { useBrandAssets } from '../../hooks/useBrandAssets';

export function BrandAssets({ workspaceId }: { workspaceId: string }) {
  const { assets, uploading, uploadAsset, deleteAsset, loadAssets } = useBrandAssets(workspaceId);

  const assetTypes = [
    { type: 'logo', label: 'Logo' },
    { type: 'wordmark', label: 'Wordmark' },
    { type: 'icon', label: 'Icon' },
  ];

  const handleFileUpload = async (assetType: string, file: File) => {
    try {
      await uploadAsset(file, assetType);
      await loadAssets(); // Refresh the list
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const getAssetForType = (type: string) => {
    return assets.find(asset => asset.assetType === type);
  };

  return (
    <div className="space-y-6">
      {assetTypes.map(({ type, label }) => {
        const asset = getAssetForType(type);
        return (
          <div key={type} className="space-y-2">
            <label className="block text-sm font-medium">{label}</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleFileUpload(type, file);
                };
                input.click();
              }}
            >
              {asset ? (
                <div className="space-y-3">
                  <img
                    src={asset.url}
                    alt={asset.filename}
                    className="max-w-full max-h-32 mx-auto rounded"
                  />
                  <div className="flex justify-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAsset(asset.id);
                      }}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                    <span className="text-sm text-gray-500 self-center">
                      {asset.filename}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl text-gray-400 mb-2">+</div>
                  <div className="text-sm text-gray-500">Upload {label}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Getting Workspace ID

The workspace ID is obtained from the URL parameters in the builder page:

```typescript
// packages/frontend/src/app/(app)/builder/page.tsx
'use client';

import { useParams } from 'next/navigation';

export default function BuilderPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string; // From URL: /builder/[workspaceId]

  // Pass workspaceId to ContextManager
  return (
    <div>
      {/* Existing builder content */}
      {activeTab === 'context' && (
        <ContextManager workspaceId={workspaceId} />
      )}
    </div>
  );
}
```

The workspace ID comes from the dynamic route `/builder/[workspaceId]` where:

- `workspaceId` is extracted from the URL path
- It's passed down to all context components
- All API calls include this `workspaceId` parameter
- The backend validates that the user owns this workspace before any operations

This ensures complete data isolation - users can only access context data for workspaces they own.

---

## Backend Implementation - ALREADY IMPLEMENTED ✅

The backend is fully implemented with the following structure:

```typescript
packages/nest/src/
├── modules/
│   └── context/
│       ├── dto/
│       │   ├── brand-asset.dto.ts ✅
│       │   ├── brand-image.dto.ts ✅
│       │   ├── color-palette.dto.ts ✅
│       │   └── product-overview.dto.ts ✅
│       ├── services/
│       │   ├── brand-asset.service.ts ✅
│       │   ├── brand-image.service.ts ✅
│       │   ├── color-palette.service.ts ✅
│       │   ├── context.service.ts ✅
│       │   └── product-overview.service.ts ✅
│       ├── controllers/
│       │   ├── brand-asset.controller.ts ✅
│       │   ├── brand-image.controller.ts ✅
│       │   ├── color-palette.controller.ts ✅
│       │   ├── context.controller.ts ✅
│       │   └── product-overview.controller.ts ✅
│       └── context.module.ts ✅
└── shared/
    ├── database/
    │   ├── entities/
    │   │   ├── brand-asset.entity.ts ✅
    │   │   ├── brand-image.entity.ts ✅
    │   │   ├── color-palette.entity.ts ✅
    │   │   └── product-overview.entity.ts ✅
    │   └── services/
    │       ├── brand-asset.service.ts ✅
    │       ├── color-palette.service.ts ✅
    │       └── product-overview.service.ts ✅
    └── storage/
        └── storage.service.ts ✅
```

#### **Already Implemented Controllers & Endpoints**

**ContextController** (`/context/:workspaceId`):

- `GET /context/:workspaceId` - Get complete context
- `GET /context/:workspaceId/summary` - Get context summary
- `DELETE /context/:workspaceId` - Delete all context data

**BrandAssetController** (`/brand-assets/:workspaceId`):

- `POST /brand-assets/:workspaceId/upload` - Upload brand asset
- `GET /brand-assets/:workspaceId` - Get all brand assets
- `GET /brand-assets/:workspaceId/:assetId` - Get specific asset
- `PUT /brand-assets/:workspaceId/:assetId/metadata` - Update metadata
- `DELETE /brand-assets/:workspaceId/:assetId` - Delete asset

**BrandImageController** (`/brand-images/:workspaceId`):

- `POST /brand-images/:workspaceId/upload` - Upload brand image
- `GET /brand-images/:workspaceId` - Get all brand images
- `GET /brand-images/:workspaceId/:imageId` - Get specific image
- `PUT /brand-images/:workspaceId/:imageId/metadata` - Update metadata
- `DELETE /brand-images/:workspaceId/:imageId` - Delete image

**ColorPaletteController** (`/color-palette/:workspaceId`):

- `POST /color-palette/:workspaceId` - Create color palette
- `GET /color-palette/:workspaceId` - Get color palette
- `PUT /color-palette/:workspaceId` - Update color palette
- `PUT /color-palette/:workspaceId/metadata` - Update metadata
- `DELETE /color-palette/:workspaceId` - Delete color palette

**ProductOverviewController** (`/product-overview/:workspaceId`):

- `POST /product-overview/:workspaceId` - Create product overview
- `GET /product-overview/:workspaceId` - Get product overview
- `PUT /product-overview/:workspaceId` - Update product overview
- `DELETE /product-overview/:workspaceId` - Delete product overview

#### **Key Implementation Details**

**Separation of Concerns**:

- **Database Services**: Pure database operations (`BrandAssetService`, `ColorPaletteService`, etc.)
- **Module Services**: Business logic and file handling (`brand-asset.service.ts`, `brand-image.service.ts`, etc.)
- **Controllers**: HTTP request/response handling with validation
- **DTOs**: Input validation and transformation

**Security Implementation**:

- JWT authentication required on all endpoints
- User ID extracted from JWT token
- All operations filtered by `userId` for complete isolation
- Workspace ownership verification

**File Upload Handling**:

- Multipart form data support with `FileInterceptor`
- File size limits (10MB) and type validation
- Automatic storage to configured provider (MinIO/S3/R2)
- File metadata storage in database

### Shared Types Definition

The shared types are already implemented in `packages/shared/src/context/` with the following structure:

```typescript
// packages/shared/src/context/index.ts - Main exports
export * from './types/context.types';
export * from './types/brand-board.types';
export * from './types/color-palette.types';
export * from './types/product-overview.types';
export * from './types/brand-assets.types';
```

#### **Core Types Already Implemented**

**BaseFile Interface** (`packages/shared/src/storage/types/file.types.ts`):

```typescript
interface BaseFile {
  id: string;
  userId: string; // Owner of the file
  filename: string; // Display filename
  storageKey: string; // Internal storage path
  mimeType: string;
  size: number;
  url?: string; // Public access URL
  metadata?: FileMetadata;
  uploadedAt: string;
}
```

**BrandImage** (`packages/shared/src/context/types/brand-board.types.ts`):

```typescript
interface BrandImage extends BaseFile {
  workspaceId: string; // Workspace association
}
```

**BrandAsset** (`packages/shared/src/context/types/brand-assets.types.ts`):

```typescript
interface BrandAsset extends BaseFile {
  workspaceId: string;
  assetType: BrandAssetType; // 'logo' | 'wordmark' | 'icon'
}
```

**ColorPalette** (`packages/shared/src/context/types/color-palette.types.ts`):

```typescript
interface ColorPalette {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  colors: Color[]; // Array of Color objects
  createdAt: string;
  updatedAt: string;
}
```

**ProductOverview** (`packages/shared/src/context/types/product-overview.types.ts`):

```typescript
interface ProductOverview {
  id: string;
  workspaceId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

**Context Aggregation** (`packages/shared/src/context/types/context.types.ts`):

```typescript
interface Context {
  workspaceId: string;
  userId: string;
  brandImages: BrandImage[];
  brandAssets: BrandAsset[];
  colorPalette?: ColorPalette;
  productOverview?: ProductOverview;
  lastUpdatedAt: string;
}
```

### Modified Backend Files

#### `packages/nest/src/app.module.ts`

**Changes Required**:

- Import the new `ContextModule` into the main application module
- Add context module to the imports array
- Ensure proper module loading order for dependency resolution

#### `packages/nest/src/shared/shared.module.ts`

**Changes Required**:

- Add storage-related services to the providers array
- Export storage services for use by other modules
- Include file processing and image optimization services
- Add storage configuration providers

#### `packages/nest/src/shared/database/database.module.ts`

**Changes Required**:

- Register new context-related entities with TypeORM
- Add entity imports for context, brand-image, color-palette, product-overview, and brand-asset entities
- Configure proper entity relationships and indexes

---

## Implementation Benefits

### ✅ **Already Fully Implemented**

The entire context management system is already implemented and ready for use:

- **Backend APIs**: All REST endpoints are live and functional
- **Database**: All entities and relationships are properly configured
- **Security**: JWT authentication and user isolation are enforced
- **File Storage**: Upload/download/delete operations work with configured storage provider
- **Frontend**: Ready to implement with the simplified architecture described above

### ✅ **Clean Architecture**

- **Strong Separation of Concerns**: API services, hooks, and components are clearly separated
- **Type Safety**: Full TypeScript support with shared types across frontend/backend
- **Modular Design**: Each context function is self-contained with its own service and hook
- **Reusable Components**: Components follow consistent patterns for easy maintenance

### ✅ **Security-First Implementation**

- **User Isolation**: All operations filtered by `userId` for complete data isolation
- **Workspace Ownership**: Backend validates user owns workspace before any operations
- **JWT Authentication**: Leverages existing authentication system
- **Input Validation**: Comprehensive validation using class-validator decorators

### ✅ **Developer Experience**

- **Intuitive APIs**: Domain-specific endpoints (`/brand-images`, `/brand-assets`, etc.)
- **Simple Frontend**: 4 image boxes, color picker divs, and text field - no complexity
- **Auto-save**: Automatic saving prevents data loss
- **Error Handling**: Proper error states and user feedback

This implementation provides a solid, working foundation for context management that's both simple to use and robust in production.
