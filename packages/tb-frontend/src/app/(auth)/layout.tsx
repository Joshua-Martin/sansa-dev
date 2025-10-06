import React from 'react';

/**
 * Props for the AuthLayout component
 */
interface AuthLayoutProps {
  /** The main content to display (auth forms) */
  children: React.ReactNode;
  /** Optional title for the left panel */
  title?: string;
  /** Optional subtitle for the left panel */
  subtitle?: string;
  /** Optional custom branding content for the left panel */
  brandingContent?: React.ReactNode;
}

/**
 * AuthLayout Component
 *
 * A reusable two-column layout for authentication pages with:
 * - Left column: Branding and marketing content with gradient background
 * - Right column: Authentication forms and content
 * - Responsive design that stacks on mobile
 * - Consistent styling and spacing
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title = 'Welcome to jbm_dev_template',
  subtitle = 'Build amazing applications with our comprehensive platform. Join thousands of developers who trust our solution.',
  brandingContent,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="grid grid-cols-[1fr_3fr_1fr] grid-rows-[1fr_3fr_1fr] h-screen w-screen shadow-xl overflow-hidden bg-background">
        {/* Top row - no top borders */}
        <div className="border-r border-b border-accent-border"></div>
        <div className="border-b border-accent-border"></div>
        <div className="border-l border-b border-accent-border"></div>

        {/* Middle row - Left (no left border) */}
        <div className="border-r border-accent-border"></div>

        {/* Middle row - Center (main content) */}
        <div className="flex items-center justify-center">
          <div className="w-full h-full max-w-7xl flex">
            <div className="w-1/2 flex flex-col items-center justify-center relative text-foreground p-8">
              {/* Custom branding content or default */}
              {brandingContent ? (
                brandingContent
              ) : (
                <div className="space-y-4 text-center">
                  <h1 className="text-4xl font-bold leading-tight">{title}</h1>
                  <p className="text-lg leading-relaxed">{subtitle}</p>
                </div>
              )}
            </div>

            {/* Right panel - Sign in form */}
            <div className="w-1/2 flex items-center justify-center bg-background/80">
              <div className="w-full p-4">{children}</div>
            </div>
          </div>
        </div>

        {/* Middle row - Right (no right border) */}
        <div className="border-l border-accent-border"></div>

        {/* Bottom row - no bottom borders */}
        <div className="border-r border-t border-accent-border"></div>
        <div className="border-t border-accent-border"></div>
        <div className="border-l border-t border-accent-border"></div>
      </div>
    </div>
  );
};

export default AuthLayout;
