/**
 * App Route Group Loading Component
 *
 * Shows during navigation within authenticated routes.
 * Provides faster feedback for app-specific loading states.
 */

export default function AppLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}
