'use client';

import React from 'react';
import {
  Bar,
  BarChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { mockTokenUsage } from './mockData';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../common/card';

type ChartDataItem = {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
};

type ChartConfigItem = {
  label: string;
  color: string;
};

type ChartConfig = Record<string, ChartConfigItem>;

const chartConfig: ChartConfig = {
  inputTokens: {
    label: 'Input Tokens',
    color: '#b3ff0f',
  },
  outputTokens: {
    label: 'Output Tokens',
    color: '#3b82f6',
  },
  totalTokens: {
    label: 'Total Tokens',
    color: '#10b981',
  },
  cost: {
    label: 'Cost ($)',
    color: '#f59e0b',
  },
};

/**
 * Token Usage Chart Component
 *
 * Displays token usage and costs over time using a combination bar and line chart
 */
const TokenUsageChart: React.FC = () => {
  // Format data for the chart
  const chartData: ChartDataItem[] = mockTokenUsage.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    inputTokens: item.inputTokens,
    outputTokens: item.outputTokens,
    totalTokens: item.totalTokens,
    cost: item.cost,
  }));

  /**
   * Custom tooltip component for the chart
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

    return (
      <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
        <div className="font-medium">{label}</div>
        <div className="grid gap-1.5">
          {payload.map((entry, index) => {
            const configItem = chartConfig[entry.dataKey];
            let formattedValue: string;
            let formattedLabel: string;

            if (entry.dataKey === 'cost') {
              formattedValue = `$${entry.value.toFixed(2)}`;
              formattedLabel = 'Cost';
            } else {
              formattedValue = `${entry.value.toLocaleString()} tokens`;
              formattedLabel = configItem?.label || entry.name;
            }

            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{formattedLabel}:</span>
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {formattedValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /**
   * Custom legend component for the chart
   */
  const CustomLegend: React.FC<{
    payload?: Array<{
      value: string;
      color: string;
    }>;
  }> = ({ payload }) => {
    if (!payload || !payload.length) {
      return null;
    }

    return (
      <div className="flex items-center justify-center gap-4 pt-3">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage & Cost</CardTitle>
        <CardDescription>
          Daily token consumption and associated costs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="tokens"
                orientation="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) =>
                  `${(value / 1000).toFixed(0)}K`
                }
              />
              <YAxis
                yAxisId="cost"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `$${value.toFixed(1)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Bar
                yAxisId="tokens"
                dataKey="inputTokens"
                fill={chartConfig.inputTokens.color}
                radius={[2, 2, 0, 0]}
              />
              <Bar
                yAxisId="tokens"
                dataKey="outputTokens"
                fill={chartConfig.outputTokens.color}
                radius={[2, 2, 0, 0]}
              />
              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke={chartConfig.cost.color}
                strokeWidth={2}
                dot={{ fill: chartConfig.cost.color, strokeWidth: 2, r: 4 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenUsageChart;
