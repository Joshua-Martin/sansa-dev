/**
 * Types for Sansa Lab Components
 */

export interface LabNamedCall {
  id: string;
  name: string;
  promptVersion: string;
  currentModel: string;
  currentCostPerCall: number;
  callCount: number;
  status: 'optimized' | 'action-available' | 'analyzing';
  benchmarkResults?: {
    alternativeModel: string;
    alternativeCostPerCall: number;
    accuracyDelta: number; // positive = alternative is better, negative = current is better
    costSavingsPercent: number;
    recommendation: 'switch' | 'keep' | 'investigate';
  };
  lastBenchmarked: string;
}

export interface LabNamedCallDetail extends LabNamedCall {
  // KPIs
  averageLatency: number; // in milliseconds
  errorRate: number; // percentage
  successRate: number; // percentage
  totalCost: number;
  cacheHitRate: number; // percentage

  // Benchmark comparison
  currentModelLatency: number; // time to first token in milliseconds
  alternativeModelLatency: number; // time to first token in milliseconds
  baselineResponse: any; // JSON response object
  alternativeResponse: any; // JSON response object
  benchmarkDate: string;

  // Performance trends
  latencyTrend: number; // percentage change
  costTrend: number; // percentage change
  accuracyTrend: number; // percentage change
}
