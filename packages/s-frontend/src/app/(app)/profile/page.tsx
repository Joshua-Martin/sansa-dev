'use client';

import React from 'react';
import { useAuth } from '../../../hooks/useAuth';

import { Card, CardContent } from '../../../components/common/card';
import PageTitle from '../../../components/custom/ui/page-title';
import ApiKeysManager from '../../../components/custom/profile/api-keys-manager';

/**
 * Profile Page Component
 *
 * A simple profile page that shows the user's profile information.
 */
const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="max-w-2xl mx-auto">
            <PageTitle
              title="User Profile"
              subtitle="Your account details and settings"
            />

            <Card>
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
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Application ID
                  </label>
                  <p className="text-lg font-mono text-sm">{user?.appId}</p>
                </div>
              </CardContent>
            </Card>

            {/* API Keys Section */}
            <Card className="mt-6">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">API Keys</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage API keys for Sansa-X LLM monitoring integration
                    </p>
                  </div>
                  <ApiKeysManager />
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
