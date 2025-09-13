/**
 * Root Page Component
 *
 * This page serves as the entry point for the application.
 * The middleware will automatically redirect users based on their authentication status:
 * - Authenticated users → /dashboard
 * - Unauthenticated users → /signin
 *
 * This component may briefly render during the redirect process.
 */

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">
          Redirecting you to the right place...
        </p>
      </div>
    </div>
  );
}
