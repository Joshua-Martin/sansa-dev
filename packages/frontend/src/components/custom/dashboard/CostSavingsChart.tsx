'use client';

import React from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent } from '../../common/card';
import { DollarSign, TrendingUp } from 'lucide-react';

/**
 * Cost savings data structure
 */
interface CostSavingsDataItem {
  date: string;
  cumulativeSavings: number;
  optimizedTokens: number;
  dailySavings: number;
}

/**
 * Chart configuration for cost savings visualization
 */
interface ChartConfigItem {
  label: string;
  color: string;
}

type ChartConfig = Record<string, ChartConfigItem>;

const chartConfig: ChartConfig = {
  cumulativeSavings: {
    label: 'Cumulative Savings',
    color: 'hsl(86, 100%, 53%)',
  },
};

/**
 * Generate mock cost savings data for the last 30 days
 * Includes 2 optimization ramps that cause gradual savings increases
 * Pattern: consistent => consistent up => more consistent up
 */
const generateCostSavingsData = (): CostSavingsDataItem[] => {
  const dates = [];
  const today = new Date();
  let cumulativeSavings = 0;

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    // Generate daily savings with some variability
    let dailySavings = Math.random() * 50 + 10; // $10-60 per day baseline

    // Create gradual ramps instead of spikes (days 9 and 19 are start points)
    const dayIndex = 29 - i; // Convert to forward timeline (0 = oldest, 29 = newest)
    if (dayIndex >= 9 && dayIndex <= 18) {
      // First optimization ramp: gradually increasing from day 9 to 18
      const rampProgress = (dayIndex - 9) / 9; // 0 to 1 over 9 days
      const rampMultiplier = 1 + (rampProgress * 1.5); // 1x to 2.5x increase
      dailySavings *= rampMultiplier;
    } else if (dayIndex >= 19) {
      // Second optimization ramp: steeper gradual increase from day 19 onward
      const rampProgress = (dayIndex - 19) / 10; // 0 to 1 over remaining days
      const rampMultiplier = 1 + (rampProgress * 2.5); // 1x to 3.5x increase
      dailySavings *= rampMultiplier;
    }

    cumulativeSavings += dailySavings;

    // Generate optimized tokens (in thousands) with gradual ramps
    let optimizedTokens = Math.floor(Math.random() * 500 + 100); // 100K-600K tokens baseline
    if (dayIndex >= 9 && dayIndex <= 18) {
      // First optimization ramp: gradually increasing tokens from day 9 to 18
      const rampProgress = (dayIndex - 9) / 9; // 0 to 1 over 9 days
      const rampMultiplier = 1 + (rampProgress * 1.2); // 1x to 2.2x increase
      optimizedTokens = Math.floor(optimizedTokens * rampMultiplier);
    } else if (dayIndex >= 19) {
      // Second optimization ramp: steeper increase from day 19 onward
      const rampProgress = (dayIndex - 19) / 10; // 0 to 1 over remaining days
      const rampMultiplier = 1 + (rampProgress * 2.0); // 1x to 3x increase
      optimizedTokens = Math.floor(optimizedTokens * rampMultiplier);
    }

    dates.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      cumulativeSavings,
      optimizedTokens,
      dailySavings,
    });
  }

  return dates;
};

/**
 * Cost Savings Impact Chart Component
 *
 * Displays cumulative cost savings over time with an area chart visualization
 * Includes visual indicators for optimization events
 */
const CostSavingsChart: React.FC = () => {
  const chartData = generateCostSavingsData();
  const totalSavings = chartData[chartData.length - 1]?.cumulativeSavings || 0;
  const totalOptimizedTokens = chartData.reduce((sum, item) => sum + item.optimizedTokens, 0);

  // Find the dates for optimization events (days 9 and 19 from the start - start of ramp up)
  const optimizationEventDates = [
    chartData[9]?.date, // Day 9 (start of ramp up for first optimization)
    chartData[19]?.date, // Day 19 (start of ramp up for second optimization)
  ].filter(Boolean);

  /**
   * Custom tooltip component for the cost savings chart
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

    // Check if this point is an optimization event
    const isOptimizationEvent = optimizationEventDates.includes(label || '');

    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <div className="font-medium mb-2 flex items-center gap-2">
          {label}
          {isOptimizationEvent && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
              Optimization
            </span>
          )}
        </div>
        <div className="grid gap-1.5">
          {payload.map((entry, index) => {
            if (entry.dataKey !== 'cumulativeSavings') return null;

            const formattedValue = `$${entry.value.toFixed(2)}`;
            const formattedLabel = 'Total Saved';

            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-[2px] shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">
                  {formattedLabel}:
                </span>
                <span className="font-mono font-medium tabular-nums text-foreground ml-auto">
                  {formattedValue}
                </span>
              </div>
            );
          })}
          {isOptimizationEvent && (
            <div className="text-green-600 text-xs mt-1">
              Call optimization applied
            </div>
          )}
        </div>
      </div>
    );
  };


  return (
    <Card className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-sm text-muted-foreground">Cost Savings Impact</h3>
      </div>
      <CardContent className="flex-1 flex flex-col">
        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-4 w-full mb-4">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                ${totalSavings.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Saved</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(totalOptimizedTokens / 1000).toFixed(0)}M
              </div>
              <div className="text-xs text-muted-foreground">Tokens Optimized</div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartConfig.cumulativeSavings.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartConfig.cumulativeSavings.color} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
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

              {/* Reference lines for optimization events */}
              {optimizationEventDates.map((date, index) => (
                <ReferenceLine
                  key={`optimization-${index}`}
                  x={date}
                  stroke={chartConfig.cumulativeSavings.color}
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  label={{
                    value: "Optimization",
                    position: "top",
                    style: {
                      fontSize: '10px',
                      fill: chartConfig.cumulativeSavings.color,
                      fontWeight: 'bold',
                      transform: `translateY(${index === 0 ? '10px' : '10px'})`,
                    }
                  }}
                />
              ))}

              <Area
                type="monotone"
                dataKey="cumulativeSavings"
                stroke={chartConfig.cumulativeSavings.color}
                strokeWidth={3}
                fill="url(#savingsGradient)"
                connectNulls={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CostSavingsChart;
