'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, User, LogOut, TestTube } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Avatar, AvatarFallback } from '../../common/avatar';

/**
 * Sidebar Component
 *
 * Thin navigation sidebar with dashboard and profile icons.
 * Provides quick access to main application sections with user avatar and sign out.
 */
const SidebarNav: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserTooltip, setShowUserTooltip] = useState(false);

  const isActive = (path: string) => pathname === path;

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      // Navigation will happen automatically via the useEffect in useAuth
    } catch (error) {
      console.error('Logout failed:', error);
      // Even on error, navigate to sign-in to ensure user is logged out
      router.push('/signin');
    }
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="fixed left-0 top-0 h-full w-16 bg-background border-r border-border flex flex-col justify-between py-4">
      {/* Top navigation buttons */}
      <div className="flex flex-col items-center space-y-4">
        {/* Dashboard Icon */}
        <button
          onClick={() => navigateTo('/dashboard')}
          className={`p-3 rounded-lg transition-colors duration-200 group ${
            isActive('/dashboard')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
          title="Dashboard"
        >
          <LayoutDashboard
            size={24}
            className={`${
              isActive('/dashboard')
                ? 'text-primary-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            } transition-colors duration-200`}
          />
        </button>

        {/* Lab Icon */}
        <button
          onClick={() => navigateTo('/lab')}
          className={`p-3 rounded-lg transition-colors duration-200 group ${
            isActive('/lab')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
          title="Lab"
        >
          <TestTube
            size={24}
            className={`${
              isActive('/lab')
                ? 'text-primary-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            } transition-colors duration-200`}
          />
        </button>

        {/* Profile Icon */}
        <button
          onClick={() => navigateTo('/profile')}
          className={`p-3 rounded-lg transition-colors duration-200 group ${
            isActive('/profile')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
          title="Profile"
        >
          <User
            size={24}
            className={`${
              isActive('/profile')
                ? 'text-primary-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            } transition-colors duration-200`}
          />
        </button>
      </div>

      {/* Bottom user section */}
      <div className="flex flex-col items-center space-y-4">
        {/* User Avatar with Tooltip */}
        <div className="relative">
          <div
            className="p-3 rounded-lg cursor-default"
            onMouseEnter={() => setShowUserTooltip(true)}
            onMouseLeave={() => setShowUserTooltip(false)}
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user ? getInitials(user.firstName, user.lastName) : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Info Tooltip */}
          {showUserTooltip && user && (
            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-card border border-border rounded-lg shadow-lg p-3 z-50 min-w-[200px]">
              <div className="text-sm">
                <p className="font-medium text-foreground">{user.fullName}</p>
                <p className="text-muted-foreground text-xs">{user.email}</p>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-card"></div>
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="p-3 rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 group"
          title="Sign Out"
        >
          <LogOut
            size={20}
            className="text-muted-foreground group-hover:text-destructive-foreground"
          />
        </button>
      </div>
    </div>
  );
};

export default SidebarNav;
