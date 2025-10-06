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
    <section className="h-full w-full space-y-6">
      {/* Header */}
      <PageTitle
        title="User Profile"
        subtitle="Your account details and settings"
      />

      {/* Profile Information */}
      <Card>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Full Name
              </label>
              <p className="text-lg mt-1">{user?.fullName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p className="text-lg mt-1">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Role
              </label>
              <p className="text-lg capitalize mt-1">{user?.role}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Application ID
              </label>
              <p className="text-lg font-mono text-sm mt-1">{user?.appId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Account Status
              </label>
              <div className="flex items-center gap-2 mt-1">
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
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`h-2 w-2 rounded-full ${user?.isEmailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
                />
                <p className="text-lg">
                  {user?.isEmailVerified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Section */}
      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">API Keys</h3>
              <p className="text-sm text-muted-foreground">
                Manage API keys for Sansa-X LLM monitoring integration
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-6">
            <ApiKeysManager />
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default ProfilePage;
