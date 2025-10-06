import React from 'react';
import PageTitle from '../../../components/custom/ui/page-title';
import { ChatMain } from '../../../components/custom/chat';

/**
 * Sansa Dashboard Page Component
 *
 * Comprehensive dashboard for the Sansa AI routing and benchmarking platform
 * showing costs, performance metrics, model comparisons, and recent activity.
 */
const DashboardPage: React.FC = () => {
  return (
    <section className="h-full w-full max-h-screen flex">

      {/* Dashboard Content */}
      <div className="flex-1 flex flex-col h-screen"> 


<div className='p-6 flex-1 h-full flex items-center justify-center'>

      {/* Left-aligned Chat */}
      <div className="w-[50vw] h-full border border-border">
        <ChatMain />
      </div>
      </div></div>
    </section>
  );
};

export default DashboardPage;
