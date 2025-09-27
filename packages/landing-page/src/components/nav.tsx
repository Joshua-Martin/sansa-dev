/**
 * Navigation Component
 *
 * Main navigation bar with logo, navigation links, and call-to-action button.
 * Features a clean, modern design with proper spacing and hover effects.
 */

import { Box } from "lucide-react";
import SansaLogo from "./brand/sansa-logo";

interface NavProps {
  /** Additional CSS classes to apply to the component */
  className?: string;
}

export function Nav({ className }: NavProps) {
  return (
    <nav className={`relative z-50 bg-none px-4 sm:px-6 lg:px-8 py-4 ${className ?? ''}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-1">
          {/* Logo Icon */}
          <SansaLogo />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8 bg-gray-100 rounded-full px-8 py-3">
          <a
            href="#solutions"
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
          >
            Solutions
          </a>
          <a
            href="#resources"
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
          >
            Resources
          </a>
          <a
            href="#company"
            className="text-gray-700 hover:text-gray-900 font-medium transition-colors duration-200"
          >
            Company
          </a>
        </div>

        {/* Call-to-Action Button */}
        <div className="flex items-center">
          <button className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200">
            Get Started
          </button>
        </div>

        {/* Mobile Menu Button (for future mobile implementation) */}
        <div className="md:hidden">
          <button className="text-gray-700 hover:text-gray-900">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}
