'use client';

import React from 'react';
import { Target, DollarSign, Zap, BarChart3 } from 'lucide-react';
import { JsonViewer } from '../../../components/custom/lab';

/**
 * Promo page for creating visual content for landing page screenshots
 * Shows layered JSON comparison between models with floating accuracy badges
 */
const PromoPage: React.FC = () => {
  // Support-routing call data from mockData
  const sonnetResponse = {
    "message": "I understand your frustration, let me connect you with someone who can better handle this situation",
    "classification": "billing-issue",
    "priority": "medium",
    "sentiment": "frustrated",
    "routes": [
      "fetch-billing-history",
      "queue-agent",
      "fetch-tracking-data"
    ]
  };

  const gptMiniResponse = {
    "message": "I apologize for the inconvenience, let me transfer you to a billing specialist who can resolve this for you",
    "classification": "billing-issue",
    "priority": "medium",
    "sentiment": "frustrated",
    "routes": [
      "fetch-billing-history",
      "queue-agent",
      "fetch-tracking-data"
    ]
  };

  return (
    <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <div className="relative w-full max-w-5xl">
        {/* Base Layer - Sonnet 4 */}
        <div className="w-full transform -rotate-1">
          <JsonViewer
            data={sonnetResponse}
            title="Claude Sonnet 4 Response - $0.045/call - 1.57s TTF"
          />
        </div>

        {/* Overlay Layer - GPT-5-mini (offset) */}
        <div className="absolute top-14 left-12 w-full transform rotate-1 shadow-2xl">
          <div className="bg-card border-2 border-foreground/80 rounded-lg overflow-hidden">
            <JsonViewer
              data={gptMiniResponse}
              title="GPT-5-mini Response - $0.0045/call - 500ms TTF"
            />
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute -right-20 -top-20 h-[60vh] w-[600px] bg-gradient-to-r from-transparent to-background z-20 pointer-events-none"></div>

        {/* Floating Accuracy Badges */}
        <div className="absolute -right-20 top-0 z-30 flex flex-col justify-start space-y-14">
          <div className="border-2 border-primary/70 bg-background/90 text-foreground px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-primary">
            <Target className="h-5 w-5" />
            96.8% Semantic Match
          </div>

          <div className="border-2 border-primary bg-background/90 text-foreground px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-primary">
            <DollarSign className="h-5 w-5" />
            90% Cost Savings
          </div>

          <div className="border-2 border-primary bg-background/90 text-foreground px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-primary">
            <Zap className="h-5 w-5" />
            68% Faster Response
          </div>

          <div className="border-2 border-primary bg-background/90 text-foreground px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 shadow-primary">
            <BarChart3 className="h-5 w-5" />
            96.8% Cosine Similarity
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoPage;
