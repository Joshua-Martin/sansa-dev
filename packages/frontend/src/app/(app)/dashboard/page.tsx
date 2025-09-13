'use client';

import React from 'react';
import { User, Settings } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/common/card';
import PageTitle from '../../../components/custom/ui/page-title';

/**
 * Dashboard Page Component
 *
 * A simple dashboard that shows the authenticated user's information
 * and provides basic navigation and logout functionality.
 */
const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
      <section className="h-full w-full">
          <PageTitle
            title={`Welcome back, ${user?.firstName}!`}
            subtitle="Here's what's happening with your account today."
          />

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

            {/* LLM API Cost Tracking Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  API Cost Tracking
                </CardTitle>
                <CardDescription>Monitor your LLM API usage and costs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    Cost tracking dashboard coming soon...
                  </p>
                </div>
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
      </section>
  );
};

export default DashboardPage;
