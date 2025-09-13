'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Settings, Wrench } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

import { Button } from '../../../components/common/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/common/card';
import { Avatar, AvatarFallback } from '../../../components/common/avatar';
import { FullLogo } from '../../../components/common/full-logo';

/**
 * Dashboard Page Component
 *
 * A simple dashboard that shows the authenticated user's information
 * and provides basic navigation and logout functionality.
 */
const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, logout, logoutState } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will happen automatically via the useEffect in useAuth
    } catch (error) {
      console.error('Logout failed:', error);
      // Even on error, navigate to sign-in to ensure user is logged out
      router.push('/signin');
    }
  };

  const handleEnterBuilder = () => {
    router.push('/builder');
  };

  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <FullLogo />
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-foreground">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutState.isLoading}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {logoutState.isLoading ? 'Signing out...' : 'Sign out'}
                    </span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="mt-2 text-muted-foreground">
                  Here&apos;s what&apos;s happening with your account today.
                </p>
              </div>
            </div>
          </div>

          {/* Dashboard cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Profile card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Profile Information
                </CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="text-sm font-medium">{user?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium capitalize">
                      {user?.role}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                      <p className="text-sm font-medium">
                        {user?.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account status card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Account Status
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email Verified</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${user?.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
                      />
                      <span className="text-sm font-medium">
                        {user?.isEmailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Account Active</span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                      />
                      <span className="text-sm font-medium">
                        {user?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Login</p>
                    <p className="text-sm font-medium">
                      {user?.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick actions card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <User className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </Button>
                {!user?.isEmailVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    Verify Email
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent activity section */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your recent account activity and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity to display.</p>
                  <p className="text-sm mt-1">
                    Activity will appear here as you use the platform.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
