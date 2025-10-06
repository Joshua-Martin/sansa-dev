'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, CardContent } from '../../common/card';

/**
 * Timeline data structure for routing decisions and system health
 * Each data point represents a 6-hour period
 */
interface TimelineDataItem {
  period: string;
  timestamp: string;
  totalCalls: number;
  normalCalls: number;
  reRoutedCalls: number;
  aggregatedAccuracy: number;
  // Add breakdown for 4 bars per 6-hour period
  normalBar1: number;
  normalBar2: number;
  normalBar3: number;
  reRoutedBar: number;
}

/**
 * Chart configuration for timeline visualization
 */
interface ChartConfigItem {
  label: string;
  color: string;
}

type ChartConfig = Record<string, ChartConfigItem>;

const chartConfig: ChartConfig = {
  normalBar1: {
    label: 'Normal Calls 1',
    color: 'rgba(255, 255, 255, 0.05)', // White with 5% opacity
  },
  normalBar2: {
    label: 'Normal Calls 2',
    color: 'rgba(255, 255, 255, 0.05)', // White with 5% opacity
  },
  normalBar3: {
    label: 'Normal Calls 3',
    color: 'rgba(255, 255, 255, 0.05)', // White with 5% opacity
  },
  reRoutedBar: {
    label: 'Re-routed Calls',
    color: 'rgba(239, 68, 68, 0.20)', // Red with 20% opacity
  },
  aggregatedAccuracy: {
    label: 'Accuracy Score',
    color: 'hsl(86, 100%, 53%)',
  },
};

/**
 * Generate mock timeline data for the last 14 days as 6-hour periods
 * 14 days × 4 periods per day = 56 data points
 */
const generateTimelineData = (): TimelineDataItem[] => {
  const periods = [];
  const today = new Date();
  const baseCallVolume = 5600; // Base volume per 6-hour period (even lower since 14 days × 4 periods)
  const baseAccuracy = 0.97; // Consistent high accuracy

  // 14 days × 4 periods per day = 56 periods
  for (let i = 55; i >= 0; i--) {
    const periodStart = new Date(today);
    periodStart.setHours(today.getHours() - i * 6); // Each period is 6 hours

    // Format period label (e.g., "Sep 6", "Sep 7", etc.)
    const periodLabel = periodStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    // Most periods have consistent call volume (small variation)
    const totalCalls = baseCallVolume + Math.floor(Math.random() * 200 - 100); // ±100 calls variation

    let reRoutedCalls: number;
    let aggregatedAccuracy: number;

    // Check if this is September 6th (simulate problematic day)
    // This should be 7 days ago from September 13th, 2025, so it should be within our 14-day window
    const isProblemDay =
      periodStart.getDate() === 6 && periodStart.getMonth() === 8; // September is month 8 (0-indexed)

    if (isProblemDay) {
      // Problem day: September 6th - distribute re-routing across the 4 periods
      const periodOfDay = i % 4; // 0, 1, 2, 3 for the 4 periods of the day

      // Pattern: first period has some routing, middle periods have most, last period has less
      let routingPercentage: number;
      switch (periodOfDay) {
        case 0: // First period: beginning of issues
          routingPercentage = 0.15;
          break;
        case 1: // Second period: issues escalating
          routingPercentage = 0.45;
          break;
        case 2: // Third period: peak of issues
          routingPercentage = 0.65;
          break;
        case 3: // Fourth period: beginning of recovery
          routingPercentage = 0.25;
          break;
        default:
          routingPercentage = 0.02;
      }

      reRoutedCalls = Math.floor(totalCalls * routingPercentage);
      // Accuracy follows the same pattern - lowest during peak routing
      const accuracyOffset = routingPercentage * 0.12; // Max 12% drop in accuracy
      aggregatedAccuracy = baseAccuracy - accuracyOffset;
    } else {
      // Normal periods: minimal re-routing, consistent accuracy
      reRoutedCalls =
        Math.floor(totalCalls * 0.02) + Math.floor(Math.random() * 10); // 2% + small variation
      aggregatedAccuracy = baseAccuracy + (Math.random() * 0.02 - 0.01); // ±1% variation around 94%
    }

    const normalCalls = totalCalls - reRoutedCalls;

    // Break normal calls into 3 bars (roughly equal distribution)
    const normalBar1 = Math.floor(normalCalls / 3);
    const normalBar2 = Math.floor(normalCalls / 3);
    const normalBar3 = normalCalls - normalBar1 - normalBar2;
    const reRoutedBar = reRoutedCalls;

    periods.push({
      period: periodLabel,
      timestamp: periodStart.toISOString(),
      totalCalls,
      normalCalls,
      reRoutedCalls,
      aggregatedAccuracy,
      normalBar1,
      normalBar2,
      normalBar3,
      reRoutedBar,
    });
  }

  return periods;
};

/**
 * Timeline Chart Component
 *
 * Displays 6-hour period call volume with routing reasons as separate bars
 * and aggregated accuracy as an overlay line chart
 */
const TimelineChart: React.FC = () => {
  const chartData = generateTimelineData();

  /**
   * Custom tooltip component for the timeline chart
   */
  const CustomTooltip: React.FC<{
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      dataKey: string;
      color: string;
    }>;
    label?: string;
  }> = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const accuracy =
      payload.find((p) => p.dataKey === 'aggregatedAccuracy')?.value || 0;
    // Calculate total calls from the bar values
    const totalCalls = payload
      .filter((entry) => entry.dataKey !== 'aggregatedAccuracy')
      .reduce((sum, entry) => sum + (entry.value || 0), 0);

    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <div className="font-medium mb-2">{label}</div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Total Calls:</span>
            <span className="font-mono font-medium">
              {totalCalls.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">Accuracy:</span>
            <span className="font-mono font-medium">
              {(accuracy * 100).toFixed(1)}%
            </span>
          </div>
          <div className="border-t border-border/30 my-1"></div>
          {payload
            .filter(
              (entry) =>
                entry.dataKey !== 'aggregatedAccuracy' && entry.value > 0
            )
            .map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground text-xs">
                  {chartConfig[entry.dataKey]?.label || entry.name}:
                </span>
                <span className="font-mono font-medium text-xs ml-auto">
                  {entry.value.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 flex-shrink-0">
        <h3 className="text-sm text-muted-foreground">
          System Activity Timeline
        </h3>
      </div>
      <CardContent className="p-0 py-6 flex-1 flex flex-col justify-end">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={7} // Show every 8th label to avoid crowding with 56 data points
              />
              <YAxis
                yAxisId="calls"
                orientation="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, 10000]}
                tickFormatter={(value: number) =>
                  `${(value / 1000).toFixed(0)}K`
                }
              />
              <YAxis
                yAxisId="accuracy"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0.8, 1.0]}
                tickFormatter={(value: number) =>
                  `${(value * 100).toFixed(0)}%`
                }
              />
              <Tooltip content={<CustomTooltip />} />

              {/* 4 stacked bars per 6-hour period */}
              <Bar
                yAxisId="calls"
                dataKey="normalBar1"
                stackId="calls"
                fill={chartConfig.normalBar1.color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                yAxisId="calls"
                dataKey="normalBar2"
                stackId="calls"
                fill={chartConfig.normalBar2.color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                yAxisId="calls"
                dataKey="normalBar3"
                stackId="calls"
                fill={chartConfig.normalBar3.color}
                radius={[0, 0, 0, 0]}
              />
              <Bar
                yAxisId="calls"
                dataKey="reRoutedBar"
                stackId="calls"
                fill={chartConfig.reRoutedBar.color}
                radius={[2, 2, 0, 0]}
              />

              {/* Accuracy line overlay - continuous without dots */}
              <Line
                yAxisId="accuracy"
                type="monotone"
                dataKey="aggregatedAccuracy"
                stroke={chartConfig.aggregatedAccuracy.color}
                strokeWidth={3}
                dot={false}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineChart;
