'use client';

import React from 'react';
import { Card, CardContent } from '../../common/card';
import { CheckCircle, AlertTriangle, Target } from 'lucide-react';

/**
 * Quality maintenance data structure
 */
interface QualityMetric {
  name: string;
  accuracyRate: number;
  threshold: number;
  callCount: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

/**
 * Generate mock quality maintenance data for named calls
 */
const generateQualityData = (): QualityMetric[] => {
  const namedCalls = [
    'schedule-orchestration',
    'document-summarization',
    'code-review',
    'data-analysis',
    'content-generation',
  ];

  return namedCalls.map((name) => {
    const accuracyRate = Math.random() * 0.15 + 0.85; // 85-100%
    const threshold = 0.9; // 90% threshold
    const callCount = Math.floor(Math.random() * 5000 + 500);

    let status: QualityMetric['status'];
    if (accuracyRate >= 0.95) status = 'excellent';
    else if (accuracyRate >= threshold) status = 'good';
    else if (accuracyRate >= 0.85) status = 'warning';
    else status = 'critical';

    return {
      name,
      accuracyRate,
      threshold,
      callCount,
      status,
    };
  });
};

/**
 * Quality Maintenance Chart Component
 *
 * Displays accuracy rates for optimized named calls with visual status indicators
 */
const QualityMaintenanceChart: React.FC = () => {
  const qualityData = generateQualityData();
  /**
   * Get status color based on quality status
   */
  const getStatusColor = (status: QualityMetric['status']) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'text-primary bg-primary/10';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'critical':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  /**
   * Get progress bar width percentage
   */
  const getProgressWidth = (accuracy: number) => {
    return Math.min(accuracy * 100, 100);
  };

  /**
   * Get progress bar color
   */
  const getProgressColor = (status: QualityMetric['status']) => {
    switch (status) {
      case 'excellent':
      case 'good':
        return 'bg-primary/70';
      case 'warning':
        return 'bg-yellow-500/70';
      case 'critical':
        return 'bg-red-500/70';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-sm text-muted-foreground">Quality Maintenance</h3>
      </div>
      <CardContent className="flex flex-col flex-1">
        <div className="flex flex-col flex-1">
          {/* Quality data section - grows to fill available space */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {qualityData.map((metric, index) => (
              <div key={index} className="space-y-1.5">
                {/* Compact named call layout */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium text-sm truncate">
                      {metric.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground ml-2">
                    <span className="font-mono font-medium text-foreground">
                      {(metric.accuracyRate * 100).toFixed(1)}%
                    </span>
                    <span className="hidden sm:inline">
                      {metric.callCount.toLocaleString()} calls
                    </span>
                  </div>
                </div>

                {/* Compact progress bar */}
                <div className="relative">
                  <div className="w-full bg-muted-foreground rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${getProgressColor(metric.status)}`}
                      style={{
                        width: `${getProgressWidth(metric.accuracyRate)}%`,
                      }}
                    />
                  </div>
                  {/* Threshold indicator */}
                  <div
                    className="absolute top-0 w-px h-1 bg-muted"
                    style={{ left: `${metric.threshold * 100}%` }}
                    title={`Threshold: ${(metric.threshold * 100).toFixed(0)}%`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend - fixed at bottom */}
          <div className="flex-shrink-0 pt-4 border-t border-border/30">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Quality Threshold: 90%</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Excellent (95%+)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span>Good (90%+)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span>Warning (&lt;90%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualityMaintenanceChart;
