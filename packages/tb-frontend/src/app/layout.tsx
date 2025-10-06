'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import './global.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Create React Query client in component to avoid SSR issues
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
          },
        },
      })
  );

  return (
    <html lang="en">
      <body className="aviator-font antialiased">
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-background text-foreground">
            {children}
          </div>
        </QueryClientProvider>
      </body>
    </html>
  );
}
