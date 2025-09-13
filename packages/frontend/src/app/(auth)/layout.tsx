import Image from 'next/image';
import React, { useState, useEffect } from 'react';

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
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Function to check if dark mode is active
    const checkDarkMode = () => {
      const hasDarkClass = document.body.classList.contains('dark');
      setIsDarkMode(hasDarkClass);
    };

    // Check dark mode on mount
    checkDarkMode();

    // Create a MutationObserver to watch for changes to the body's class list
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Cleanup observer on unmount
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <Image
        src={isDarkMode ? '/wave-white.png' : '/wave-blk.png'}
        alt="Aviator Logo"
        width={1920}
        height={1080}
        className="absolute top-0 left-0 w-full h-full opacity-60"
      />

      <div className="w-full max-w-7xl mx-auto relative p-10">
        <div className="bg-none rounded-3xl shadow-xl overflow-hidden flex min-h-[600px] relative">
          {/* Left panel - Aviator branding */}
          <div className="w-1/2 flex flex-col items-center justify-center relative bg-primary p-10">
            {/* Custom branding content or default */}
            {brandingContent ? (
              brandingContent
            ) : (
              <div className="space-y-4 text-center">
                <h1 className="text-4xl font-bold text-white leading-tight">
                  {title}
                </h1>
                <p className="text-white text-lg leading-relaxed">{subtitle}</p>
              </div>
            )}
          </div>

          {/* Right panel - Sign in form */}
          <div className="w-1/2 flex items-center justify-center bg-background/80">
            <div className="w-full p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
