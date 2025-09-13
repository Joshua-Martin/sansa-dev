import {
  CostData,
  TokenUsage,
  ModelMetric,
  NamedCall,
  PerformanceMetrics,
  BenchmarkResult,
} from './types';

/**
 * Mock data for Sansa Dashboard
 */

// Generate date range for the last 30 days
const generateDates = (days: number): string[] => {
  const dates = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
};

// Cost data over time
export const mockCostData: CostData[] = generateDates(30).map((date, index) => ({
  date,
  gpt4: Math.random() * 50 + 20,
  gpt35: Math.random() * 30 + 10,
  claude: Math.random() * 40 + 15,
  gemini: Math.random() * 25 + 8,
  total: 0, // Will be calculated
})).map(item => ({
  ...item,
  total: item.gpt4 + item.gpt35 + item.claude + item.gemini
}));

// Token usage data
export const mockTokenUsage: TokenUsage[] = generateDates(30).map((date, index) => {
  const inputTokens = Math.floor(Math.random() * 50000 + 10000);
  const outputTokens = Math.floor(Math.random() * 20000 + 5000);
  const totalTokens = inputTokens + outputTokens;
  const cost = totalTokens * 0.0001; // Mock cost per token

  return {
    date,
    inputTokens,
    outputTokens,
    totalTokens,
    cost,
  };
});

// Model metrics
export const mockModelMetrics: ModelMetric[] = [
  {
    name: 'GPT-4',
    provider: 'OpenAI',
    cost: 45.23,
    latency: 2.3,
    accuracy: 0.94,
    coverage: 0.98,
    hallucinationRate: 0.03,
    cacheHitRate: 0.15,
    relevanceScore: 0.91,
    callCount: 1234,
  },
  {
    name: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    cost: 12.45,
    latency: 1.1,
    accuracy: 0.89,
    coverage: 0.96,
    hallucinationRate: 0.08,
    cacheHitRate: 0.25,
    relevanceScore: 0.87,
    callCount: 3456,
  },
  {
    name: 'Claude Sonnet',
    provider: 'Anthropic',
    cost: 32.67,
    latency: 1.8,
    accuracy: 0.92,
    coverage: 0.97,
    hallucinationRate: 0.04,
    cacheHitRate: 0.18,
    relevanceScore: 0.89,
    callCount: 2341,
  },
  {
    name: 'Gemini Pro',
    provider: 'Google',
    cost: 18.92,
    latency: 1.5,
    accuracy: 0.88,
    coverage: 0.94,
    hallucinationRate: 0.06,
    cacheHitRate: 0.22,
    relevanceScore: 0.85,
    callCount: 1876,
  },
];

// Recent named calls
export const mockNamedCalls: NamedCall[] = [
  {
    id: '1',
    name: 'schedule-orchestration',
    promptVersion: '0.2',
    model: 'GPT-4',
    cost: 0.45,
    latency: 2.1,
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    status: 'success',
    customField: 'user-123',
  },
  {
    id: '2',
    name: 'document-summarization',
    promptVersion: '0.1',
    model: 'GPT-3.5 Turbo',
    cost: 0.12,
    latency: 1.2,
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    status: 'success',
    customField: 'tenant-prod',
  },
  {
    id: '3',
    name: 'code-review',
    promptVersion: '0.3',
    model: 'Claude Sonnet',
    cost: 0.32,
    latency: 1.9,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'success',
    customField: 'experiment-a1',
  },
  {
    id: '4',
    name: 'data-analysis',
    promptVersion: '0.1',
    model: 'Gemini Pro',
    cost: 0.18,
    latency: 1.4,
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'error',
    customField: 'user-456',
  },
  {
    id: '5',
    name: 'schedule-orchestration',
    promptVersion: '0.2',
    model: 'GPT-4',
    cost: 0.47,
    latency: 2.3,
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    status: 'success',
    customField: 'tenant-dev',
  },
];

// Overall performance metrics
export const mockPerformanceMetrics: PerformanceMetrics = {
  relevanceScore: 0.89,
  coverage: 0.96,
  hallucinationRate: 0.05,
  latency: 1.7,
  cacheHitRate: 0.20,
  driftDetection: 0.02,
};

// Benchmark results
export const mockBenchmarkResults: BenchmarkResult[] = [
  {
    model1: 'GPT-4',
    model2: 'Claude Sonnet',
    accuracyDelta: 0.02,
    costDelta: -0.27,
    latencyDelta: 0.5,
    recommendation: 'model2',
  },
  {
    model1: 'GPT-3.5 Turbo',
    model2: 'Gemini Pro',
    accuracyDelta: 0.01,
    costDelta: -0.06,
    latencyDelta: -0.4,
    recommendation: 'model1',
  },
  {
    model1: 'Claude Sonnet',
    model2: 'Gemini Pro',
    accuracyDelta: 0.04,
    costDelta: 0.14,
    latencyDelta: 0.3,
    recommendation: 'model1',
  },
];

// Recent activity summary
export const mockRecentActivity = {
  totalCalls: 12345,
  totalCost: 234.56,
  avgLatency: 1.8,
  errorRate: 0.02,
  topNamedCall: 'schedule-orchestration',
  mostUsedModel: 'GPT-3.5 Turbo',
};
