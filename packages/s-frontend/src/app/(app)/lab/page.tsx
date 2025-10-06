'use client';

import React from 'react';
import PageTitle from '../../../components/custom/ui/page-title';
import {
  NamedCallsTable,
  mockLabNamedCalls,
} from '../../../components/custom/lab';

/**
 * Sansa Lab Page Component
 *
 * Lab and AB testing area for the Sansa AI routing and benchmarking platform
 * showing named calls performance, optimization status, and cost-saving opportunities.
 */
const LabPage: React.FC = () => {
  return (
    <section className="h-full w-full space-y-6">
      {/* Header */}
      <PageTitle
        title="Sansa Lab"
        subtitle="A/B testing and optimization lab for AI routing decisions"
      />

      {/* Named Calls Table */}
      <NamedCallsTable data={mockLabNamedCalls} />
    </section>
  );
};

export default LabPage;
