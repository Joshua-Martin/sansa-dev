import { create } from 'zustand';

/**
 * Device viewport types for the workspace preview
 */
export type DeviceViewport = 'desktop' | 'tablet' | 'mobile';

/**
 * Device viewport configurations for responsive preview
 */
export const DEVICE_VIEWPORTS = {
  desktop: { width: '100%', height: '100%', label: 'Desktop' },
  tablet: { width: '768px', height: '1024px', label: 'Tablet' },
  mobile: { width: '375px', height: '667px', label: 'Mobile' },
} as const;

/**
 * Builder store interface
 */
interface BuilderState {
  /** Current selected device viewport for preview */
  selectedViewport: DeviceViewport;

  /** Current workspace ID for context operations */
  workspaceId: string | null;

  /** Current active tab (preview or context) */
  activeTab: 'preview' | 'context';

  /** Actions */
  setSelectedViewport: (viewport: DeviceViewport) => void;
  setWorkspaceId: (workspaceId: string | null) => void;
  setActiveTab: (tab: 'preview' | 'context') => void;
}

/**
 * Builder store for managing workspace preview state
 *
 * This store manages the state of the builder interface, specifically:
 * - Device viewport selection for the workspace preview
 * - Workspace ID for context operations
 * - Active tab state (preview vs context)
 */
export const useBuilderStore = create<BuilderState>((set) => ({
  // Initial state
  selectedViewport: 'desktop',
  workspaceId: null,
  activeTab: 'preview',

  // Actions
  setSelectedViewport: (viewport: DeviceViewport) =>
    set({ selectedViewport: viewport }),
  setWorkspaceId: (workspaceId: string | null) => set({ workspaceId }),
  setActiveTab: (tab: 'preview' | 'context') => set({ activeTab: tab }),
}));

/**
 * Builder store hooks for specific functionality
 */
export const useBuilderViewport = () => {
  const { selectedViewport, setSelectedViewport } = useBuilderStore();
  return { selectedViewport, setSelectedViewport };
};

export const useBuilderWorkspace = () => {
  const { workspaceId, setWorkspaceId } = useBuilderStore();
  return { workspaceId, setWorkspaceId };
};

export const useBuilderTab = () => {
  const { activeTab, setActiveTab } = useBuilderStore();
  return { activeTab, setActiveTab };
};
