/**
 * Types for Sansa Dashboard Components
 */

export interface CostData {
  date: string;
  gpt4: number;
  gpt35: number;
  claude: number;
  gemini: number;
  total: number;
}

export interface TokenUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
}

export interface ModelMetric {
  name: string;
  provider: string;
  cost: number;
  latency: number;
  accuracy: number;
  coverage: number;
  hallucinationRate: number;
  cacheHitRate: number;
  relevanceScore: number;
  callCount: number;
}

export interface NamedCall {
  id: string;
  name: string;
  promptVersion: string;
  model: string;
  cost: number;
  latency: number;
  timestamp: string;
  status: 'success' | 'error' | 'timeout';
  customField?: string;
}

export interface PerformanceMetrics {
  relevanceScore: number;
  coverage: number;
  hallucinationRate: number;
  latency: number;
  cacheHitRate: number;
  driftDetection: number;
}

export interface BenchmarkResult {
  model1: string;
  model2: string;
  accuracyDelta: number;
  costDelta: number;
  latencyDelta: number;
  recommendation: 'model1' | 'model2' | 'neutral';
}
