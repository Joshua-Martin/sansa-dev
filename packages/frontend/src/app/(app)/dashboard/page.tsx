'use client';

import React from 'react';
import PageTitle from '../../../components/custom/ui/page-title';
import {
  PerformanceMetricsWidget,
  TimelineChart,
  CostSavingsChart,
} from '../../../components/custom/dashboard';

/**
 * Sansa Dashboard Page Component
 *
 * Comprehensive dashboard for the Sansa AI routing and benchmarking platform
 * showing costs, performance metrics, model comparisons, and recent activity.
 */
const DashboardPage: React.FC = () => {

  return (
    <section className="h-full w-full space-y-6 max-h-screen flex flex-col">
      {/* Header */}
      <PageTitle
        title="Good morning, Joshua"
      />

      {/* KPI Grid with 2x2 System Reliability Score */}
      <PerformanceMetricsWidget />

      {/* Middle Charts - Half Width Each */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <CostSavingsChart />
        <TimelineChart />
      </div>
    </section>
  );
};

export default DashboardPage;
