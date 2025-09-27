'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { mockCostData } from './mockData';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../common/card';

type ChartDataItem = {
  date: string;
  gpt4: number;
  gpt35: number;
  claude: number;
  gemini: number;
  total: number;
};

type ChartConfigItem = {
  label: string;
  color: string;
};

type ChartConfig = Record<string, ChartConfigItem>;

const chartConfig: ChartConfig = {
  gpt4: {
    label: 'GPT-4',
    color: '#b3ff0f',
  },
  gpt35: {
    label: 'GPT-3.5 Turbo',
    color: '#3b82f6',
  },
  claude: {
    label: 'Claude',
    color: '#10b981',
  },
  gemini: {
    label: 'Gemini',
    color: '#f59e0b',
  },
  total: {
    label: 'Total',
    color: '#8b5cf6',
  },
};

/**
 * Cost Overview Chart Component
 *
 * Displays cost breakdown by model over time using an area chart
 */
const CostOverviewChart: React.FC = () => {
  // Format data for the chart
  const chartData: ChartDataItem[] = mockCostData.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    gpt4: item.gpt4,
    gpt35: item.gpt35,
    claude: item.claude,
    gemini: item.gemini,
    total: item.total,
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
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">
                {chartConfig[entry.dataKey]?.label || entry.name}:
              </span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                ${entry.value.toFixed(2)}
              </span>
            </div>
          ))}
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
        <CardTitle>Cost Overview</CardTitle>
        <CardDescription>
          Daily API costs by model over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => `$${value.toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              <Area
                type="monotone"
                dataKey="gpt4"
                stackId="1"
                stroke={chartConfig.gpt4.color}
                fill={chartConfig.gpt4.color}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="gpt35"
                stackId="1"
                stroke={chartConfig.gpt35.color}
                fill={chartConfig.gpt35.color}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="claude"
                stackId="1"
                stroke={chartConfig.claude.color}
                fill={chartConfig.claude.color}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="gemini"
                stackId="1"
                stroke={chartConfig.gemini.color}
                fill={chartConfig.gemini.color}
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostOverviewChart;
