import { LabNamedCall, LabNamedCallDetail } from './types';

/**
 * Mock data for Sansa Lab
 */

// Lab/AB Testing mock data
export const mockLabNamedCalls: LabNamedCall[] = [
  {
    id: '1',
    name: 'schedule-orchestration',
    promptVersion: '0.3',
    currentModel: 'GPT-4',
    currentCostPerCall: 0.45,
    callCount: 15432,
    status: 'action-available',
    benchmarkResults: {
      alternativeModel: 'Claude Sonnet',
      alternativeCostPerCall: 0.32,
      accuracyDelta: 0.02,
      costSavingsPercent: 28.9,
      recommendation: 'switch',
    },
    lastBenchmarked: '2025-09-10T14:30:00Z',
  },
  {
    id: '2',
    name: 'document-summarization',
    promptVersion: '0.2',
    currentModel: 'GPT-3.5 Turbo',
    currentCostPerCall: 0.12,
    callCount: 8765,
    status: 'optimized',
    lastBenchmarked: '2025-09-08T09:15:00Z',
  },
  {
    id: '3',
    name: 'code-review',
    promptVersion: '0.4',
    currentModel: 'Claude Sonnet',
    currentCostPerCall: 0.32,
    callCount: 5432,
    status: 'action-available',
    benchmarkResults: {
      alternativeModel: 'Gemini Pro',
      alternativeCostPerCall: 0.18,
      accuracyDelta: -0.03,
      costSavingsPercent: 43.8,
      recommendation: 'investigate',
    },
    lastBenchmarked: '2025-09-12T16:45:00Z',
  },
  {
    id: '4',
    name: 'data-analysis',
    promptVersion: '0.1',
    currentModel: 'Gemini Pro',
    currentCostPerCall: 0.18,
    callCount: 3210,
    status: 'action-available',
    benchmarkResults: {
      alternativeModel: 'GPT-3.5 Turbo',
      alternativeCostPerCall: 0.12,
      accuracyDelta: 0.01,
      costSavingsPercent: 33.3,
      recommendation: 'switch',
    },
    lastBenchmarked: '2025-09-11T11:20:00Z',
  },
  {
    id: '5',
    name: 'content-generation',
    promptVersion: '0.2',
    currentModel: 'GPT-4',
    currentCostPerCall: 0.47,
    callCount: 9876,
    status: 'analyzing',
    lastBenchmarked: '2025-09-09T13:10:00Z',
  },
  {
    id: '6',
    name: 'customer-support',
    promptVersion: '0.3',
    currentModel: 'GPT-3.5 Turbo',
    currentCostPerCall: 0.11,
    callCount: 15678,
    status: 'optimized',
    lastBenchmarked: '2025-09-07T08:30:00Z',
  },
  {
    id: '7',
    name: 'sentiment-analysis',
    promptVersion: '0.1',
    currentModel: 'Gemini Pro',
    currentCostPerCall: 0.16,
    callCount: 7654,
    status: 'action-available',
    benchmarkResults: {
      alternativeModel: 'GPT-3.5 Turbo',
      alternativeCostPerCall: 0.10,
      accuracyDelta: 0.02,
      costSavingsPercent: 37.5,
      recommendation: 'switch',
    },
    lastBenchmarked: '2025-09-10T17:55:00Z',
  },
  {
    id: '8',
    name: 'translation-service',
    promptVersion: '0.2',
    currentModel: 'Claude Sonnet',
    currentCostPerCall: 0.31,
    callCount: 4321,
    status: 'optimized',
    lastBenchmarked: '2025-09-06T12:40:00Z',
  },
  {
    id: '9',
    name: 'support-routing',
    promptVersion: '0.3',
    currentModel: 'sonnet 4',
    currentCostPerCall: 0.28,
    callCount: 12876,
    status: 'action-available',
    benchmarkResults: {
      alternativeModel: 'gpt-5-mini',
      alternativeCostPerCall: 0.15,
      accuracyDelta: -0.02,
      costSavingsPercent: 46.4,
      recommendation: 'investigate',
    },
    lastBenchmarked: '2025-09-13T10:15:00Z',
  },
];

/**
 * Detailed mock data for individual named call pages
 */
export const mockLabNamedCallDetails: Record<string, LabNamedCallDetail> = {
  '1': {
    id: '1',
    name: 'schedule-orchestration',
    promptVersion: '0.3',
    currentModel: 'GPT-4',
    currentCostPerCall: 0.45,
    callCount: 15432,
    status: 'action-available',
    benchmarkResults: {
      alternativeModel: 'Claude Sonnet',
      alternativeCostPerCall: 0.32,
      accuracyDelta: 0.02,
      costSavingsPercent: 28.9,
      recommendation: 'switch',
    },
    lastBenchmarked: '2025-09-10T14:30:00Z',
    // KPIs
    averageLatency: 1250,
    errorRate: 1.2,
    successRate: 98.8,
    totalCost: 6957.60,
    cacheHitRate: 15.3,
    // Benchmark comparison
    currentModelLatency: 850,
    alternativeModelLatency: 620,
    baselineResponse: {
      "meeting_scheduled": true,
      "meeting_details": {
        "title": "Team Standup",
        "date": "2025-10-02",
        "time": "10:00",
        "timezone": "EST",
        "duration_minutes": 60,
        "location": "Conference Room A",
        "virtual_option": true
      },
      "attendees": [
        {"name": "Sarah", "role": "organizer", "email": "sarah@company.com"},
        {"name": "Mike", "role": "developer", "email": "mike@company.com"},
        {"name": "Jennifer", "role": "designer", "email": "jennifer@company.com"},
        {"name": "David", "role": "product_manager", "email": "david@company.com"}
      ],
      "actions_taken": [
        "calendar_invite_sent",
        "room_booking_confirmed",
        "reminder_scheduled"
      ],
      "confidence_score": 0.95
    },
    alternativeResponse: {
      "meeting_scheduled": true,
      "meeting_details": {
        "title": "Daily Standup Meeting",
        "date": "2025-10-02",
        "time": "10:00",
        "timezone": "EST",
        "duration_minutes": 60,
        "location": "Conference Room A",
        "virtual_option": true
      },
      "attendees": [
        {"name": "Mike", "role": "developer", "email": "mike@company.com"},
        {"name": "Sarah", "role": "organizer", "email": "sarah@company.com"},
        {"name": "David", "role": "product_manager", "email": "david@company.com"},
        {"name": "Jennifer", "role": "designer", "email": "jennifer@company.com"}
      ],
      "actions_taken": [
        "room_booking_confirmed",
        "calendar_invite_sent",
        "reminder_scheduled"
      ],
      "confidence_score": 0.89
    },
    benchmarkDate: '2025-09-10T14:30:00Z',
    // Trends
    latencyTrend: -8.5,
    costTrend: 12.3,
    accuracyTrend: 2.1,
  },
  '2': {
    id: '2',
    name: 'document-summarization',
    promptVersion: '0.2',
    currentModel: 'GPT-3.5 Turbo',
    currentCostPerCall: 0.12,
    callCount: 8765,
    status: 'optimized',
    lastBenchmarked: '2025-09-08T09:15:00Z',
    // KPIs
    averageLatency: 890,
    errorRate: 0.8,
    successRate: 99.2,
    totalCost: 1051.80,
    cacheHitRate: 23.7,
    // Benchmark comparison
    currentModelLatency: 580,
    alternativeModelLatency: 450,
    baselineResponse: {
      "analysis_type": "financial_report_summary",
      "period": "Q3",
      "key_metrics": {
        "total_revenue": 4000000,
        "revenue_growth_yoy": 0.15,
        "gross_margin": 0.72,
        "net_margin": 0.18,
        "operating_expenses_change": 0.08
      },
      "revenue_breakdown": {
        "saas_subscriptions": {"amount": 2400000, "percentage": 0.60},
        "professional_services": {"amount": 1200000, "percentage": 0.30},
        "license_fees": {"amount": 400000, "percentage": 0.10}
      },
      "recommendations": [
        "Continue SaaS platform investment",
        "Expand sales team capacity",
        "Optimize service delivery processes",
        "Monitor competitive landscape"
      ],
      "risk_factors": ["market_competition", "currency_fluctuations"],
      "confidence_score": 0.92
    },
    alternativeResponse: {
      "analysis_type": "financial_report_summary",
      "period": "Q3",
      "key_metrics": {
        "total_revenue": 4000000,
        "revenue_growth_yoy": 0.15,
        "gross_margin": 0.73,
        "net_margin": 0.17,
        "operating_expenses_change": 0.09
      },
      "revenue_breakdown": {
        "saas_subscriptions": {"amount": 2400000, "percentage": 0.60},
        "professional_services": {"amount": 1200000, "percentage": 0.30},
        "license_fees": {"amount": 400000, "percentage": 0.10}
      },
      "recommendations": [
        "Expand sales team capacity",
        "Continue SaaS platform investment",
        "Monitor competitive landscape",
        "Optimize service delivery processes"
      ],
      "risk_factors": ["currency_fluctuations", "market_competition"],
      "confidence_score": 0.91
    },
    benchmarkDate: '2025-09-08T09:15:00Z',
    // Trends
    latencyTrend: -5.2,
    costTrend: -3.1,
    accuracyTrend: 0.8,
  },
  '3': {
    id: '3',
    name: 'code-review',
    promptVersion: '0.4',
    currentModel: 'Claude Sonnet',
    currentCostPerCall: 0.32,
    callCount: 5432,
    status: 'action-available',
    benchmarkResults: {
      alternativeModel: 'Gemini Pro',
      alternativeCostPerCall: 0.18,
      accuracyDelta: -0.03,
      costSavingsPercent: 43.8,
      recommendation: 'investigate',
    },
    lastBenchmarked: '2025-09-12T16:45:00Z',
    // KPIs
    averageLatency: 2100,
    errorRate: 2.1,
    successRate: 97.9,
    totalCost: 1738.24,
    cacheHitRate: 8.9,
    // Benchmark comparison
    currentModelLatency: 1420,
    alternativeModelLatency: 980,
    baselineResponse: {
      "code_review": {
        "file": "user-service.js",
        "severity_summary": {
          "critical": 2,
          "high": 1,
          "medium": 2,
          "low": 3
        },
        "issues": [
          {
            "type": "security",
            "severity": "critical",
            "line": 127,
            "description": "SQL injection vulnerability via string concatenation",
            "recommendation": "Use parameterized queries or prepared statements",
            "cwe": "CWE-89"
          },
          {
            "type": "security",
            "severity": "high",
            "line": 89,
            "description": "Cross-site scripting risk in HTML output",
            "recommendation": "Implement proper input sanitization",
            "cwe": "CWE-79"
          },
          {
            "type": "performance",
            "severity": "medium",
            "lines": "234-245",
            "description": "N+1 query pattern detected",
            "recommendation": "Implement batch loading or eager fetching"
          },
          {
            "type": "memory",
            "severity": "medium",
            "line": 156,
            "description": "Event listeners not cleaned up in componentWillUnmount",
            "recommendation": "Add proper cleanup in useEffect return"
          },
          {
            "type": "quality",
            "severity": "low",
            "line": 3,
            "description": "Unused import: lodash.debounce",
            "recommendation": "Remove unused dependency"
          }
        ],
        "metrics": {
          "cyclomatic_complexity": 12,
          "maintainability_index": 65,
          "lines_of_code": 342
        },
        "recommendations": [
          "Implement comprehensive input validation",
          "Add error boundaries for API calls",
          "Consider implementing caching layer",
          "Add unit tests for edge cases"
        ]
      },
      "confidence_score": 0.94
    },
    alternativeResponse: {
      "code_review": {
        "file": "user-service.js",
        "severity_summary": {
          "critical": 2,
          "high": 1,
          "medium": 1,
          "low": 4
        },
        "issues": [
          {
            "type": "security",
            "severity": "high",
            "line": 89,
            "description": "Cross-site scripting risk in HTML output",
            "recommendation": "Implement proper input sanitization",
            "cwe": "CWE-79"
          },
          {
            "type": "security",
            "severity": "critical",
            "line": 127,
            "description": "SQL injection vulnerability via string concatenation",
            "recommendation": "Use parameterized queries or prepared statements",
            "cwe": "CWE-89"
          },
          {
            "type": "performance",
            "severity": "medium",
            "lines": "234-245",
            "description": "N+1 query pattern detected",
            "recommendation": "Implement batch loading or eager fetching"
          },
          {
            "type": "quality",
            "severity": "low",
            "line": 3,
            "description": "Unused import: lodash.debounce",
            "recommendation": "Remove unused dependency"
          },
          {
            "type": "memory",
            "severity": "medium",
            "line": 156,
            "description": "Event listeners not cleaned up in componentWillUnmount",
            "recommendation": "Add proper cleanup in useEffect return"
          }
        ],
        "metrics": {
          "cyclomatic_complexity": 11,
          "maintainability_index": 67,
          "lines_of_code": 342
        },
        "recommendations": [
          "Add error boundaries for API calls",
          "Implement comprehensive input validation",
          "Add unit tests for edge cases",
          "Consider implementing caching layer"
        ]
      },
      "confidence_score": 0.93
    },
    benchmarkDate: '2025-09-12T16:45:00Z',
    // Trends
    latencyTrend: 15.7,
    costTrend: 8.9,
    accuracyTrend: -1.2,
  },
  '9': {
    id: '9',
    name: 'support-routing',
    promptVersion: '0.3',
    currentModel: 'sonnet 4',
    currentCostPerCall: 0.28,
    callCount: 12876,
    status: 'action-available',
    benchmarkResults: {
      alternativeModel: 'gpt-5-mini',
      alternativeCostPerCall: 0.15,
      accuracyDelta: -0.02,
      costSavingsPercent: 46.4,
      recommendation: 'investigate',
    },
    lastBenchmarked: '2025-09-13T10:15:00Z',
    // KPIs
    averageLatency: 1450,
    errorRate: 1.8,
    successRate: 98.2,
    totalCost: 3605.28,
    cacheHitRate: 12.4,
    // Benchmark comparison
    currentModelLatency: 980,
    alternativeModelLatency: 720,
    baselineResponse: {
      "message": "I understand your frustration, let me connect you with someone who can better handle this situation",
      "classification": "billing-issue",
      "priority": "medium",
      "sentiment": "frustrated",
      "routes": [
        "fetch-billing-history",
        "queue-agent",
        "fetch-tracking-data"
      ]
    },
    alternativeResponse: {
      "message": "I apologize for the inconvenience, let me transfer you to a billing specialist who can resolve this for you",
      "classification": "billing-issue",
      "priority": "medium",
      "sentiment": "frustrated",
      "routes": [
        "fetch-billing-history",
        "queue-agent",
        "fetch-tracking-data"
      ]
    },
    benchmarkDate: '2025-09-13T10:15:00Z',
    // Trends
    latencyTrend: -12.3,
    costTrend: 18.7,
    accuracyTrend: 0.8,
  },
};
