'use client';

import React from 'react';
import { useAuth } from '../../../hooks/useAuth';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/common/card';

/**
 * Profile Page Component
 *
 * A simple profile page that shows the user's profile information.
 */
const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-foreground">Profile</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              User Profile
            </h2>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <p className="text-lg">{user?.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-lg">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <p className="text-lg capitalize">{user?.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Account Status
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                    <p className="text-lg">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Verification
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-2 w-2 rounded-full ${user?.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
                    />
                    <p className="text-lg">
                      {user?.isEmailVerified ? 'Verified' : 'Pending'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
