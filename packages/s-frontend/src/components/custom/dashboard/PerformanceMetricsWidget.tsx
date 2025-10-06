'use client';

import React from 'react';
import {
  Activity,
  Target,
  AlertTriangle,
  Database,
  TrendingDown,
  DollarSign,
  Zap,
  XCircle,
  Shield,
  CheckCircle2,
  Router,
} from 'lucide-react';
import { mockPerformanceMetrics, mockRecentActivity } from './mockData';
import { DashboardMetric } from '../../common/dashboard-metric';

/**
 * Platform Metrics Component
 *
 * Displays key performance indicators and usage metrics for the Sansa platform
 */
const PerformanceMetricsWidget: React.FC = () => {
  const metrics = mockPerformanceMetrics;
  const activity = mockRecentActivity;

  // Helper function to get trend based on metric value
  const getTrend = (
    value: number,
    goodThreshold: number,
    reverse: boolean = false
  ) => {
    if (reverse) {
      return value <= goodThreshold
        ? 'up'
        : value >= goodThreshold + 0.1
          ? 'down'
          : 'neutral';
    }
    return value >= goodThreshold
      ? 'up'
      : value <= goodThreshold - 0.1
        ? 'down'
        : 'neutral';
  };

  // Helper function to get change percentage (mock)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getChange = (_value: number) => {
    return Math.round((Math.random() - 0.5) * 20); // Random change between -10% and +10%
  };

  const performanceMetrics: DashboardMetric[] = [
    {
      title: 'Total API Calls',
      value: activity.totalCalls.toLocaleString(),
      icon: Activity,
      trend: 'up',
      change: 12,
      suffix: '',
    },
    {
      title: 'Total Cost',
      value: `$${activity.totalCost.toFixed(2)}`,
      icon: DollarSign,
      trend: 'down',
      change: -8,
      suffix: '',
    },
    {
      title: 'Avg Latency',
      value: `${activity.avgLatency.toFixed(1)}`,
      icon: Zap,
      trend: getTrend(activity.avgLatency, 2.0, true), // Lower latency is better
      change: 3,
      suffix: 's',
    },
    {
      title: 'Error Rate',
      value: `${(activity.errorRate * 100).toFixed(1)}%`,
      icon: XCircle,
      trend: getTrend(activity.errorRate, 0.05, true), // Lower error rate is better
      change: -15,
      suffix: '',
    },
    {
      title: 'Relevance Score',
      value: `${(metrics.relevanceScore * 100).toFixed(1)}%`,
      icon: Target,
      trend: getTrend(metrics.relevanceScore, 0.85),
      change: getChange(metrics.relevanceScore),
      suffix: '',
    },
    {
      title: 'Hallucination Rate',
      value: `${(metrics.hallucinationRate * 100).toFixed(1)}%`,
      icon: AlertTriangle,
      trend: getTrend(metrics.hallucinationRate, 0.05, true), // Lower is better
      change: getChange(metrics.hallucinationRate),
      suffix: '',
    },
    {
      title: 'Cache Hit Rate',
      value: `${(metrics.cacheHitRate * 100).toFixed(1)}%`,
      icon: Database,
      trend: getTrend(metrics.cacheHitRate, 0.2),
      change: getChange(metrics.cacheHitRate),
      suffix: '',
    },
    {
      title: 'Drift Detection',
      value: `${(metrics.driftDetection * 100).toFixed(1)}%`,
      icon: TrendingDown,
      trend: getTrend(metrics.driftDetection, 0.03, true), // Lower drift is better
      change: getChange(metrics.driftDetection),
      suffix: '',
    },
  ];

  // Calculate system reliability score
  const calculateReliabilityScore = () => {
    const uptime = 99.8; // Mock uptime percentage
    const successfulRoutingDecisions = 1247; // Mock routing decisions
    const errorRate = activity.errorRate;

    // Simple reliability score calculation (0-100)
    const score = Math.min(
      100,
      uptime - errorRate * 1000 + successfulRoutingDecisions / 100
    );
    return Math.max(0, score);
  };

  const reliabilityScore = calculateReliabilityScore();
  const uptime = 99.8;
  const routingDecisions = 1247;
  const failoversHandled = 23;

  return (
    <div className="space-y-6">
      {/* Main KPI Grid - 6 columns x 2 rows with 2x2 reliability score */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {/* First row - 4 regular KPIs + 2x2 reliability score */}
        {performanceMetrics.slice(0, 4).map((metric, index) => (
          <DashboardMetric
            key={index}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
            change={metric.change}
            suffix={metric.suffix}
          />
        ))}

        {/* System Reliability Score - spans 2 columns and 2 rows */}
        <div className="md:col-span-2 md:row-span-2">
          <div className="h-full p-6 rounded-lg border bg-card text-card-foreground border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm text-muted-foreground">
                System Reliability
              </h3>
            </div>

            {/* Large reliability score */}
            <div className="text-center mb-4">
              <div className="text-4xl font-bold text-primary mb-1">
                {reliabilityScore.toFixed(0)}
              </div>
              <div className="text-sm text-muted-foreground">
                Reliability Score
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">Uptime</span>
                </div>
                <span className="font-mono font-medium">{uptime}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Router className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">
                    Routing Decisions
                  </span>
                </div>
                <span className="font-mono font-medium">
                  {routingDecisions.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-orange-600" />
                  <span className="text-muted-foreground">
                    Failovers Handled
                  </span>
                </div>
                <span className="font-mono font-medium">
                  {failoversHandled}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Second row - 4 more regular KPIs (reliability score takes up 2 spots, so we have 4 remaining) */}
        {performanceMetrics.slice(4, 8).map((metric, index) => (
          <DashboardMetric
            key={index + 4}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
            trend={metric.trend}
            change={metric.change}
            suffix={metric.suffix}
          />
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetricsWidget;
