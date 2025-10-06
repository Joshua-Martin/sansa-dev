/**
 * Auth Route Group Loading Component
 *
 * Shows during navigation within authentication routes.
 * Provides consistent loading experience for auth pages.
 */

export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <div className="animate-pulse bg-muted rounded-lg h-12 w-48"></div>
        </div>

        <div className="bg-card border shadow-sm rounded-lg px-6 py-8 sm:px-10">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
