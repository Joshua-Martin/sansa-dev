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
  const getTrend = (value: number, goodThreshold: number, reverse: boolean = false) => {
    if (reverse) {
      return value <= goodThreshold ? 'up' : value >= goodThreshold + 0.1 ? 'down' : 'neutral';
    }
    return value >= goodThreshold ? 'up' : value <= goodThreshold - 0.1 ? 'down' : 'neutral';
  };

  // Helper function to get change percentage (mock)
  const getChange = (value: number) => {
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
      trend: getTrend(metrics.cacheHitRate, 0.20),
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {performanceMetrics.map((metric, index) => (
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
    </div>
  );
};

export default PerformanceMetricsWidget;
