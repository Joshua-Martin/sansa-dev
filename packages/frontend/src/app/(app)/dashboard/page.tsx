'use client';

import React from 'react';
import PageTitle from '../../../components/custom/ui/page-title';
import {
  CostOverviewChart,
  TokenUsageChart,
  PerformanceMetricsWidget,
} from '../../../components/custom/dashboard';

/**
 * Sansa Dashboard Page Component
 *
 * Comprehensive dashboard for the Sansa AI routing and benchmarking platform
 * showing costs, performance metrics, model comparisons, and recent activity.
 */
const DashboardPage: React.FC = () => {

  return (
    <section className="h-full w-full space-y-6">
      {/* Header */}
      <PageTitle
        title="Sansa Dashboard"
        subtitle="Monitor your AI routing performance, costs, and optimization opportunities"
      />

      {/* Platform Overview */}
      <PerformanceMetricsWidget />

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostOverviewChart />
        <TokenUsageChart />
      </div>
    </section>
  );
};

export default DashboardPage;
