'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, DollarSign, Zap } from 'lucide-react';
import {
  JsonViewer,
  mockLabNamedCallDetails,
} from '../../../../components/custom/lab';
/**
 * Individual Named Call Detail Page
 *
 * Shows detailed benchmarking data, KPIs, and response comparisons
 * for a specific named call and prompt version.
 */
const NamedCallDetailPage: React.FC = () => {
  const params = useParams();
  const namedCallId = params['named-call-id'] as string;

  const callDetail = mockLabNamedCallDetails[namedCallId];

  if (!callDetail) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Named Call Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The requested named call could not be found.
          </p>
          <Link
            href="/lab"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lab
          </Link>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(3)}`;
  const formatLatency = (ms: number) => `${ms}ms`;

  return (
    <section className="h-full w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/lab"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lab
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">{callDetail.name}</h1>
          <p className="text-muted-foreground">
            Version {callDetail.promptVersion} •{' '}
            {callDetail.callCount.toLocaleString()} calls
          </p>
        </div>
      </div>

      {/* Benchmark Comparison Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Model Comparison</h2>
          <div className="text-sm text-muted-foreground">
            Last benchmarked:{' '}
            {new Date(callDetail.benchmarkDate).toLocaleDateString()}
          </div>
        </div>

        {callDetail.benchmarkResults && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Model Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">
                  {callDetail.currentModel}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Current Production Model
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Cost per call
                    </span>
                  </div>
                  <span className="font-mono font-medium">
                    {formatCurrency(callDetail.currentCostPerCall)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Time to first token
                    </span>
                  </div>
                  <span className="font-mono font-medium">
                    {formatLatency(callDetail.currentModelLatency)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Total calls
                    </span>
                  </div>
                  <span className="font-mono font-medium">
                    {callDetail.callCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Alternative Model Card */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="font-semibold text-lg">
                  {callDetail.benchmarkResults.alternativeModel}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Benchmark Alternative
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Cost per call
                    </span>
                  </div>
                  <span className="font-mono font-medium">
                    {formatCurrency(
                      callDetail.benchmarkResults.alternativeCostPerCall
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Time to first token
                    </span>
                  </div>
                  <span className="font-mono font-medium">
                    {formatLatency(callDetail.alternativeModelLatency)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-sm text-primary">
                      Potential Savings
                    </span>
                  </div>
                  <span className="font-mono font-medium text-primary">
                    {callDetail.benchmarkResults.costSavingsPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Response Comparison */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Current Model Response */}

        <JsonViewer
          data={callDetail.baselineResponse}
          title={`${callDetail.currentModel} JSON Output`}
        />

        {/* Alternative Model Response */}

        <JsonViewer
          data={callDetail.alternativeResponse}
          title={`${callDetail.benchmarkResults?.alternativeModel || 'Alternative'} JSON Output`}
        />
      </div>
    </section>
  );
};

export default NamedCallDetailPage;
