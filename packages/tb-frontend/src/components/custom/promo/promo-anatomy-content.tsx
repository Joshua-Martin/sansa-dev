'use client';

import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { AIProvider } from '../../../../../tb-shared/src';
import type { LLMMessage } from '../../../../../tb-shared/src';
import { cn } from '../../../lib/utils/utils';
import { MarkdownRenderer } from '../../../components/common/markdown-renderer';
import { HoverableSection, useAnatomyExplorer } from './sansa-anatomy-explorer';

/**
 * Promo comparison data structure
 */
interface PromoComparisonData {
  defaultModel: string;
  defaultProvider: string;
  defaultContent: string;
  defaultTokenCountInput: number;
  defaultTokenCountOutput: number;
  defaultTokenCostInput: number;
  defaultTokenCostOutput: number;
  defaultMessageCost: number;
}

/**
 * Extended message type for promo mode
 */
type PromoLLMMessage = LLMMessage & { promoComparison?: PromoComparisonData };

/**
 * Static fake messages for promo display
 */
const promoMessages: PromoLLMMessage[] = [
  {
    threadId: '7e20563e-dbc5-4a4f-9da0-d018613a7cc0',
    role: 'user',
    content: 'Please give me a summary of brown vs board of education',
    status: 'completed',
    model: 'gpt-4o-mini',
    provider: AIProvider.OPEN_AI,
    tokenCountInput: 14,
    tokenCountOutput: 0,
    tokenCostInput: 0.000002,
    tokenCostOutput: 0.0,
    messageCost: 0.000002,
    id: '954fb0d1-3e81-4013-95c7-339927b32fcb',
    createdAt: new Date('2025-10-07T12:19:59.980Z'),
    updatedAt: new Date('2025-10-07T12:19:59.980Z'),
  },
  {
    id: 'e8ad6dde-ef34-445d-8ded-47be58807480',
    threadId: '7e20563e-dbc5-4a4f-9da0-d018613a7cc0',
    role: 'assistant',
    content:
      '"Brown v. Board of Education" was a landmark Supreme Court case decided in 1954. It challenged the legality of racial segregation in public schools. The case combined several different lawsuits from various states, all arguing that segregated schools were inherently...',
    status: 'completed',
    model: 'claude-opus-4',
    provider: AIProvider.ANTHROPIC,
    tokenCountInput: 436,
    tokenCountOutput: 201,
    tokenCostInput: 0.000065,
    tokenCostOutput: 0.000121,
    messageCost: 0.0576,
    createdAt: new Date('2025-10-07T12:19:59.984Z'),
    updatedAt: new Date('2025-10-07T12:20:03.159Z'),
  },
  {
    threadId: '7e20563e-dbc5-4a4f-9da0-d018613a7cc0',
    role: 'user',
    content: 'thanks',
    status: 'completed',
    model: 'gpt-4o-mini',
    provider: AIProvider.OPEN_AI,
    tokenCountInput: 2,
    tokenCountOutput: 0,
    tokenCostInput: 0.0,
    tokenCostOutput: 0.0,
    messageCost: 0.0,
    id: '7a65103d-f896-4729-b1dd-c99a1088b4b2',
    createdAt: new Date('2025-10-07T12:20:11.976Z'),
    updatedAt: new Date('2025-10-07T12:20:11.976Z'),
  },
  {
    id: 'a42ac97e-3f4d-4ae6-aac4-0672792aa4cb',
    threadId: '7e20563e-dbc5-4a4f-9da0-d018613a7cc0',
    role: 'assistant',
    content:
      "You're welcome! If you have any more questions or need further information, feel free to ask!",
    status: 'completed',
    model: 'gpt-4o-mini',
    provider: AIProvider.OPEN_AI,
    tokenCountInput: 645,
    tokenCountOutput: 25,
    tokenCostInput: 0.000097,
    tokenCostOutput: 0.000015,
    messageCost: 0.000112,
    createdAt: new Date('2025-10-07T12:20:11.980Z'),
    updatedAt: new Date('2025-10-07T12:20:14.224Z'),
    promoComparison: {
      defaultModel: 'claude-opus-4',
      defaultProvider: AIProvider.ANTHROPIC,
      defaultContent:
        "You're welcome! If you have any more questions or need further information, feel free to ask!",
      defaultTokenCountInput: 645,
      defaultTokenCountOutput: 25,
      defaultTokenCostInput: 0.009675,
      defaultTokenCostOutput: 0.001875,
      defaultMessageCost: 0.01155,
    },
  },
];

/**
 * Format currency helper
 *
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(amount);
};

/**
 * Format number helper
 *
 * @param num - The number to format
 * @returns Formatted number string
 */
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Get provider logo path
 *
 * @param provider - The provider name
 * @returns Logo path
 */
const getProviderLogo = (provider: string): string => {
  switch (provider) {
    case 'anthropic':
      return '/ai-logos/claude.png';
    case 'gemini':
      return '/ai-logos/gemini.png';
    case 'openai':
      return '/ai-logos/openai.png';
    case 'grok':
      return '/ai-logos/xai.png';
    default:
      return '/ai-logos/openai.png';
  }
};

/**
 * Path data for SVG annotations
 */
interface PathData {
  d: string;
  color: string;
}

/**
 * Label configuration with offset
 */
interface LabelConfig {
  /** Vertical offset in pixels (positive moves down, negative moves up) */
  offsetY: number;
  /** Horizontal distance from container edge in pixels (negative values place outside container) */
  horizontalDistance: number;
}

/**
 * Configuration for all label positions
 */
interface LabelConfigs {
  routed: LabelConfig;
  baseline: LabelConfig;
  costSavings: LabelConfig;
  unrouted: LabelConfig;
  semanticSimilarity: LabelConfig;
}

/**
 * Label positioning configuration
 * Adjust offsetY values to fine-tune vertical positioning (positive = down, negative = up)
 */
const LABEL_CONFIGS: LabelConfigs = {
  routed: {
    offsetY: -130,
    horizontalDistance: -50,
  },
  baseline: {
    offsetY: 100,
    horizontalDistance: -50,
  },
  costSavings: {
    offsetY: 0,
    horizontalDistance: -50,
  },
  unrouted: {
    offsetY: -100,
    horizontalDistance: -200,
  },
  semanticSimilarity: {
    offsetY: 0,
    horizontalDistance: -220,
  },
};

/**
 * PromoAnatomyContent Component
 *
 * Displays the anatomy of AI routing calls with SVG annotations.
 * Shows comparison between routed and baseline calls.
 */
export function PromoAnatomyContent() {
  const { activeSection, setActiveSection } = useAnatomyExplorer();
  const isCostSavingsActive = activeSection === 'cost-savings';

  // Helper function to get path color based on hover state
  const getPathColor = (section: string) => {
    return activeSection === section ? '#97ff0f' : '#64748b';
  };
  
  const routedCallRef = useRef<HTMLDivElement>(null);
  const baselineCallRef = useRef<HTMLDivElement>(null);
  const routedLabelRef = useRef<HTMLDivElement>(null);
  const baselineLabelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const costSavingsLabelRef = useRef<HTMLDivElement>(null);
  const routedCostRef = useRef<HTMLDivElement>(null);
  const baselineCostRef = useRef<HTMLDivElement>(null);
  const unroutedCallRef = useRef<HTMLDivElement>(null);
  const unroutedLabelRef = useRef<HTMLDivElement>(null);
  const semanticSimilarityLabelRef = useRef<HTMLDivElement>(null);

  const [routedPath, setRoutedPath] = useState<PathData | null>(null);
  const [baselinePath, setBaselinePath] = useState<PathData | null>(null);
  const [costSavingsPathTop, setCostSavingsPathTop] = useState<PathData | null>(null);
  const [costSavingsPathBottom, setCostSavingsPathBottom] = useState<PathData | null>(null);
  const [unroutedPath, setUnroutedPath] = useState<PathData | null>(null);
  const [semanticSimilarityPathTop, setSemanticSimilarityPathTop] = useState<PathData | null>(null);
  const [semanticSimilarityPathBottom, setSemanticSimilarityPathBottom] = useState<PathData | null>(null);

  // Label positions
  const [routedLabelPosition, setRoutedLabelPosition] = useState<{ top: number; left: number } | null>(null);
  const [baselineLabelPosition, setBaselineLabelPosition] = useState<{ top: number; left: number } | null>(null);
  const [costSavingsLabelPosition, setCostSavingsLabelPosition] = useState<{ top: number; left: number } | null>(null);
  const [unroutedLabelPosition, setUnroutedLabelPosition] = useState<{ top: number; right: number } | null>(null);
  const [semanticSimilarityLabelPosition, setSemanticSimilarityLabelPosition] = useState<{ top: number; right: number } | null>(null);

  /**
   * Calculate SVG paths based on element positions
   */
  useEffect(() => {
    const calculatePaths = () => {
      if (
        !routedCallRef.current ||
        !baselineCallRef.current ||
        !routedLabelRef.current ||
        !baselineLabelRef.current ||
        !containerRef.current
      ) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();

      // Get positions relative to container
      const routedRect = routedCallRef.current.getBoundingClientRect();
      const baselineRect = baselineCallRef.current.getBoundingClientRect();
      const routedLabelRect = routedLabelRef.current.getBoundingClientRect();
      const baselineLabelRect = baselineLabelRef.current.getBoundingClientRect();

      // Calculate routed call path (start from label, go right then down to message element)
      const routedStartX = routedLabelRect.right - containerRect.left;
      const routedStartY = routedLabelRect.top + routedLabelRect.height / 2 - containerRect.top;
      const routedEndX = routedRect.left + routedRect.width / 2 - containerRect.left;
      const routedEndY = routedRect.top - containerRect.top;

      const routedCornerRadius = 8;

      // Calculate intermediate point (go right first, then turn down)
      const routedMidX = routedEndX; // Vertical line at message center X

      const routedPathD = `
        M ${routedStartX} ${routedStartY}
        L ${routedMidX - routedCornerRadius} ${routedStartY}
        Q ${routedMidX} ${routedStartY} ${routedMidX} ${routedStartY + routedCornerRadius}
        L ${routedEndX} ${routedEndY}
      `;

      // Calculate baseline call path (start from label, go right then down to message element)
      const baselineStartX = baselineLabelRect.right - containerRect.left;
      const baselineStartY = baselineLabelRect.top + baselineLabelRect.height / 2 - containerRect.top;
      const baselineEndX = baselineRect.left + baselineRect.width / 2 - containerRect.left;
      const baselineEndY = baselineRect.bottom - containerRect.top;

      const baselineCornerRadius = 8;

      // Calculate intermediate point (go right first, then turn down)
      const baselineMidY = baselineStartY; // Horizontal line at label height

      const baselinePathD = `
        M ${baselineStartX} ${baselineStartY}
        L ${baselineEndX - baselineCornerRadius} ${baselineMidY}
        Q ${baselineEndX} ${baselineMidY} ${baselineEndX} ${baselineMidY - baselineCornerRadius}
        L ${baselineEndX} ${baselineEndY}
      `;

      setRoutedPath({ d: routedPathD, color: '#64748b' });
      setBaselinePath({ d: baselinePathD, color: '#64748b' });

      // Calculate Cost Savings forking path
      if (costSavingsLabelRef.current && routedCostRef.current && baselineCostRef.current) {
        const costLabelRect = costSavingsLabelRef.current.getBoundingClientRect();
        const routedCostRect = routedCostRef.current.getBoundingClientRect();
        const baselineCostRect = baselineCostRef.current.getBoundingClientRect();

        // Start from right edge of label
        const costStartX = costLabelRect.right - containerRect.left;
        const costStartY = costLabelRect.top + costLabelRect.height / 2 - containerRect.top;

        // End points at the cost elements (left edge center)
        const routedCostEndX = routedCostRect.left - containerRect.left;
        const routedCostEndY = routedCostRect.top + routedCostRect.height / 2 - containerRect.top;

        const baselineCostEndX = baselineCostRect.left - containerRect.left;
        const baselineCostEndY = baselineCostRect.top + baselineCostRect.height / 2 - containerRect.top;

        // Fork point - midway horizontally
        const forkX = costStartX + (routedCostEndX - costStartX) / 2;
        const forkY = costStartY;

        const cornerRadius = 12;

        // Top path (to routed cost) - with rounded transition from horizontal to vertical
        const costTopPathD = `
          M ${costStartX} ${costStartY}
          L ${forkX - cornerRadius} ${forkY}
          Q ${forkX} ${forkY} ${forkX} ${forkY - cornerRadius}
          L ${forkX} ${routedCostEndY + cornerRadius}
          Q ${forkX} ${routedCostEndY} ${forkX + cornerRadius} ${routedCostEndY}
          L ${routedCostEndX} ${routedCostEndY}
        `;

        // Bottom path (to baseline cost) - with rounded transition from horizontal to vertical
        const costBottomPathD = `
          M ${costStartX} ${costStartY}
          L ${forkX - cornerRadius} ${forkY}
          Q ${forkX} ${forkY} ${forkX} ${forkY + cornerRadius}
          L ${forkX} ${baselineCostEndY - cornerRadius}
          Q ${forkX} ${baselineCostEndY} ${forkX + cornerRadius} ${baselineCostEndY}
          L ${baselineCostEndX} ${baselineCostEndY}
        `;

        setCostSavingsPathTop({ d: costTopPathD, color: '#64748b' });
        setCostSavingsPathBottom({ d: costBottomPathD, color: '#64748b' });
      }

      // Calculate Unrouted Call path
      if (unroutedCallRef.current && unroutedLabelRef.current) {
        const unroutedRect = unroutedCallRef.current.getBoundingClientRect();
        const unroutedLabelRect = unroutedLabelRef.current.getBoundingClientRect();

        // Start from bottom center of label
        const unroutedStartX = unroutedLabelRect.left + unroutedLabelRect.width / 2 - containerRect.left;
        const unroutedStartY = unroutedLabelRect.bottom - containerRect.top;

        // End at right edge center of the unrouted message
        const unroutedEndX = unroutedRect.right - containerRect.left;
        const unroutedEndY = unroutedRect.top + unroutedRect.height / 2 - containerRect.top;

        const unroutedCornerRadius = 8;
        const unroutedGoingDown = unroutedEndY > unroutedStartY;

        const unroutedPathD = `
          M ${unroutedStartX} ${unroutedStartY}
          L ${unroutedStartX} ${unroutedEndY - (unroutedGoingDown ? unroutedCornerRadius : -unroutedCornerRadius)}
          Q ${unroutedStartX} ${unroutedEndY} ${unroutedStartX - unroutedCornerRadius} ${unroutedEndY}
          L ${unroutedEndX} ${unroutedEndY}
        `;

        setUnroutedPath({ d: unroutedPathD, color: '#64748b' });
      }

      // Calculate Semantic Similarity forking path
      if (semanticSimilarityLabelRef.current && routedCallRef.current && baselineCallRef.current) {
        const semanticLabelRect = semanticSimilarityLabelRef.current.getBoundingClientRect();
        const routedMsgRect = routedCallRef.current.getBoundingClientRect();
        const baselineMsgRect = baselineCallRef.current.getBoundingClientRect();

        // End at left edge of label
        const semanticEndX = semanticLabelRect.left - containerRect.left;
        const semanticEndY = semanticLabelRect.top + semanticLabelRect.height / 2 - containerRect.top;

        // Start points at the message elements (right edge center)
        const routedMsgStartX = routedMsgRect.right - containerRect.left;
        const routedMsgStartY = routedMsgRect.top + routedMsgRect.height / 2 - containerRect.top;

        const baselineMsgStartX = baselineMsgRect.right - containerRect.left;
        const baselineMsgStartY = baselineMsgRect.top + baselineMsgRect.height / 2 - containerRect.top;

        // Fork point - midway horizontally
        const semanticForkX = routedMsgStartX + (semanticEndX - routedMsgStartX) / 2;
        const semanticForkY = semanticEndY;

        const semanticCornerRadius = 12;

        // Top path (from routed message) - with rounded transition from horizontal to vertical
        const semanticTopPathD = `
          M ${routedMsgStartX} ${routedMsgStartY}
          L ${semanticForkX - semanticCornerRadius} ${routedMsgStartY}
          Q ${semanticForkX} ${routedMsgStartY} ${semanticForkX} ${routedMsgStartY + semanticCornerRadius}
          L ${semanticForkX} ${semanticForkY - semanticCornerRadius}
          Q ${semanticForkX} ${semanticForkY} ${semanticForkX + semanticCornerRadius} ${semanticForkY}
          L ${semanticEndX} ${semanticEndY}
        `;

        // Bottom path (from baseline message) - with rounded transition from horizontal to vertical
        const semanticBottomPathD = `
          M ${baselineMsgStartX} ${baselineMsgStartY}
          L ${semanticForkX - semanticCornerRadius} ${baselineMsgStartY}
          Q ${semanticForkX} ${baselineMsgStartY} ${semanticForkX} ${baselineMsgStartY - semanticCornerRadius}
          L ${semanticForkX} ${semanticForkY + semanticCornerRadius}
          Q ${semanticForkX} ${semanticForkY} ${semanticForkX + semanticCornerRadius} ${semanticForkY}
          L ${semanticEndX} ${semanticEndY}
        `;

        setSemanticSimilarityPathTop({ d: semanticTopPathD, color: '#64748b' });
        setSemanticSimilarityPathBottom({ d: semanticBottomPathD, color: '#64748b' });
      }

      // Calculate label positions
      // Routed Label - aligned with routed call vertical center
      if (routedCallRef.current && routedLabelRef.current) {
        const routedRect = routedCallRef.current.getBoundingClientRect();
        const routedLabelRect = routedLabelRef.current.getBoundingClientRect();
        
        // Center vertically with the routed call, apply offset, position to the left
        // Align right edge by subtracting label width from horizontal distance
        const top = routedRect.top + routedRect.height / 2 - routedLabelRect.height / 2 - containerRect.top + LABEL_CONFIGS.routed.offsetY;
        const left = LABEL_CONFIGS.routed.horizontalDistance - routedLabelRect.width;
        
        setRoutedLabelPosition({ top, left });
      }

      // Baseline Label - aligned with baseline call vertical center
      if (baselineCallRef.current && baselineLabelRef.current) {
        const baselineRect = baselineCallRef.current.getBoundingClientRect();
        const baselineLabelRect = baselineLabelRef.current.getBoundingClientRect();
        
        // Center vertically with the baseline call, apply offset, position to the left
        // Align right edge by subtracting label width from horizontal distance
        const top = baselineRect.top + baselineRect.height / 2 - baselineLabelRect.height / 2 - containerRect.top + LABEL_CONFIGS.baseline.offsetY;
        const left = LABEL_CONFIGS.baseline.horizontalDistance - baselineLabelRect.width;
        
        setBaselineLabelPosition({ top, left });
      }

      // Cost Savings Label - aligned with midpoint between the two cost elements
      if (routedCostRef.current && baselineCostRef.current && costSavingsLabelRef.current) {
        const routedCostRect = routedCostRef.current.getBoundingClientRect();
        const baselineCostRect = baselineCostRef.current.getBoundingClientRect();
        const costLabelRect = costSavingsLabelRef.current.getBoundingClientRect();
        
        // Calculate midpoint between the two cost elements' centers
        const routedCostCenterY = routedCostRect.top + routedCostRect.height / 2;
        const baselineCostCenterY = baselineCostRect.top + baselineCostRect.height / 2;
        const midpointY = (routedCostCenterY + baselineCostCenterY) / 2;
        
        // Center the label vertically on the midpoint, apply offset
        // Align right edge by subtracting label width from horizontal distance
        const top = midpointY - costLabelRect.height / 2 - containerRect.top + LABEL_CONFIGS.costSavings.offsetY;
        const left = LABEL_CONFIGS.costSavings.horizontalDistance - costLabelRect.width;
        
        setCostSavingsLabelPosition({ top, left });
      }

      // Unrouted Label - aligned with unrouted call vertical center
      if (unroutedCallRef.current && unroutedLabelRef.current) {
        const unroutedRect = unroutedCallRef.current.getBoundingClientRect();
        const unroutedLabelRect = unroutedLabelRef.current.getBoundingClientRect();
        
        // Center vertically with the unrouted call, apply offset, position to the right
        const top = unroutedRect.top + unroutedRect.height / 2 - unroutedLabelRect.height / 2 - containerRect.top + LABEL_CONFIGS.unrouted.offsetY;
        const right = LABEL_CONFIGS.unrouted.horizontalDistance;
        
        setUnroutedLabelPosition({ top, right });
      }

      // Semantic Similarity Label - aligned with midpoint between routed and baseline messages
      if (routedCallRef.current && baselineCallRef.current && semanticSimilarityLabelRef.current) {
        const routedMsgRect = routedCallRef.current.getBoundingClientRect();
        const baselineMsgRect = baselineCallRef.current.getBoundingClientRect();
        const semanticLabelRect = semanticSimilarityLabelRef.current.getBoundingClientRect();
        
        // Calculate midpoint between the two messages' centers
        const routedMsgCenterY = routedMsgRect.top + routedMsgRect.height / 2;
        const baselineMsgCenterY = baselineMsgRect.top + baselineMsgRect.height / 2;
        const midpointY = (routedMsgCenterY + baselineMsgCenterY) / 2;
        
        // Center the label vertically on the midpoint, apply offset
        const top = midpointY - semanticLabelRect.height / 2 - containerRect.top + LABEL_CONFIGS.semanticSimilarity.offsetY;
        const right = LABEL_CONFIGS.semanticSimilarity.horizontalDistance;
        
        setSemanticSimilarityLabelPosition({ top, right });
      }
    };

    // Calculate on mount and on resize
    calculatePaths();
    window.addEventListener('resize', calculatePaths);
    
    // Use a small timeout to ensure layout is complete
    const timer = setTimeout(calculatePaths, 100);

    return () => {
      window.removeEventListener('resize', calculatePaths);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative w-full bg-background p-8">
      {/* Main content container */}
      <div className="max-w-5xl mx-auto relative" ref={containerRef}>
        {/* Message list container */}
        <div className="space-y-1" id="message-container">
          {promoMessages.map((message) => {
            const isUser = message.role === 'user';
            const isAssistant = message.role === 'assistant';
            const hasComparison = 'promoComparison' in message;

            return (
              <div key={message.id} className={cn('flex gap-2 px-4 py-3 m-2')}>
                {/* User messages */}
                {isUser && (
                  <>
                    <div className="flex-[0_0_25%]"></div>
                    <div className="bg-primary dark:bg-muted dark:border dark:border-border rounded-xl ml-auto w-fit text-primary-foreground dark:text-foreground px-3 py-2">
                      <span>{message.content}</span>
                    </div>
                  </>
                )}

                {/* Assistant messages with comparison */}
                {isAssistant && hasComparison && (
                  <HoverableSection section="semantic-similarity" className="flex-1 space-y-2">
                    {/* Routed Model (GPT-4o-mini) */}
                    <HoverableSection section="routed-call">
                      <div
                        className="flex gap-2"
                        ref={routedCallRef}
                        data-label="routed-call"
                      >
                        {/* Message stats */}
                        <div className="flex-[0_0_25%] bg-muted border border-border rounded-lg px-3 py-2 text-foreground">
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <Image
                                src={getProviderLogo(message.provider)}
                                alt={`${message.provider} logo`}
                                width={20}
                                height={20}
                                className="h-5 w-5 object-contain rounded-full"
                              />
                              <span className="text-xs text-foreground font-medium">
                                {message.model}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground">Input:</span>
                                <span>{formatNumber(message.tokenCountInput)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-foreground">Output:</span>
                                <span>
                                  {formatNumber(message.tokenCountOutput)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs border-t border-border pt-1">
                                <span className="text-foreground">Total:</span>
                                <span>
                                  {formatNumber(
                                    message.tokenCountInput +
                                      message.tokenCountOutput
                                  )}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "flex items-center justify-between text-xs bg-white rounded-xl relative z-10 p-2 px-3 transition-all duration-200",
                                  isCostSavingsActive && "scale-110 ring-2 ring-primary ring-offset-2 shadow-xl"
                                )}
                                ref={routedCostRef}
                                onMouseEnter={() => setActiveSection('cost-savings')}
                                onMouseLeave={() => setActiveSection(null)}
                              >
                                <span className="text-foreground">Cost:</span>
                                <span>{formatCurrency(message.messageCost)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Message content */}
                        <div className="flex-1 bg-muted border border-border rounded-lg px-3 py-2">
                          <div
                            className="text-foreground overflow-hidden"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.5em',
                              maxHeight: '6em'
                            }}
                          >
                            <MarkdownRenderer
                              content={message.content || ''}
                              className={cn(
                                'prose prose-sm max-w-none dark:prose-invert',
                                '[&_*]:text-current [&_.text-primary]:text-current [&_.text-primary-foreground]:text-current'
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </HoverableSection>

                    {/* Default Model (Claude Opus 4) - Baseline */}
                    <HoverableSection section="baseline-call">
                      <div
                        className="flex gap-2"
                        ref={baselineCallRef}
                        data-label="baseline-call"
                      >
                        {/* Message stats */}
                        <div className="flex-[0_0_25%] bg-muted border border-border rounded-lg px-3 py-2 text-foreground">
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2">
                              <Image
                                src={getProviderLogo(
                                  message.promoComparison!.defaultProvider
                                )}
                                alt={`${message.promoComparison!.defaultProvider} logo`}
                                width={20}
                                height={20}
                                className="h-5 w-5 object-contain rounded-full"
                              />
                              <span className="text-xs text-foreground font-medium">
                                {message.promoComparison!.defaultModel}
                              </span>
                            </div>
                            <div
                              className={cn(
                                "flex items-center justify-between text-xs bg-white rounded-xl relative z-10 p-2 transition-all duration-200",
                                isCostSavingsActive && "scale-110 ring-2 ring-primary ring-offset-2 shadow-xl"
                              )}
                              ref={baselineCostRef}
                              onMouseEnter={() => setActiveSection('cost-savings')}
                              onMouseLeave={() => setActiveSection(null)}
                            >
                              <span className="text-foreground">Cost:</span>
                              <span>
                                {formatCurrency(
                                  message.promoComparison!.defaultMessageCost
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Message content */}
                        <div className="flex-1 bg-muted border border-border rounded-lg px-3 py-2">
                          <div className="text-foreground">
                            <MarkdownRenderer
                              content={message.promoComparison!.defaultContent}
                              className={cn(
                                'prose prose-sm max-w-none dark:prose-invert',
                                '[&_*]:text-current [&_.text-primary]:text-current [&_.text-primary-foreground]:text-current'
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </HoverableSection>
                  </HoverableSection>
                )}

                {/* Assistant messages without comparison */}
                {isAssistant && !hasComparison && (
                  <HoverableSection section="unrouted-call">
                    <div className="flex-1 flex gap-2" ref={unroutedCallRef}>
                      {/* Message stats */}
                      <div className="flex-[0_0_25%] bg-muted border border-border rounded-lg px-3 py-2 text-foreground">
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <Image
                              src={getProviderLogo(message.provider)}
                              alt={`${message.provider} logo`}
                              width={20}
                              height={20}
                              className="h-5 w-5 object-contain rounded-full"
                            />
                            <span className="text-xs text-foreground font-medium">
                              {message.model}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-foreground">Input:</span>
                              <span>{formatNumber(message.tokenCountInput)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-foreground">Output:</span>
                              <span>
                                {formatNumber(message.tokenCountOutput)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs border-t border-border pt-1">
                              <span className="text-foreground">Total:</span>
                              <span>
                                {formatNumber(
                                  message.tokenCountInput + message.tokenCountOutput
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs border-t border-border pt-1">
                              <span className="text-foreground">Cost:</span>
                              <span>{formatCurrency(message.messageCost)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Message content */}
                      <div className="flex-1 bg-muted border border-border rounded-lg px-3 py-2">
                        <div className="text-foreground">
                          <MarkdownRenderer
                            content={message.content || ''}
                            className={cn(
                              'prose prose-sm max-w-none dark:prose-invert',
                              '[&_*]:text-current [&_.text-primary]:text-current [&_.text-primary-foreground]:text-current'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </HoverableSection>
                )}
              </div>
            );
          })}
        </div>

        {/* SVG Overlay for annotations */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          style={{ zIndex: 10 }}
        >
          <defs>
            <marker
              id="arrowhead-blue"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill={getPathColor('routed-call')} />
            </marker>
            <marker
              id="arrowhead-green"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill={getPathColor('baseline-call')} />
            </marker>
            <marker
              id="arrowhead-amber"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill={getPathColor('cost-savings')} />
            </marker>
            <marker
              id="arrowhead-purple"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill={getPathColor('unrouted-call')} />
            </marker>
            <marker
              id="arrowhead-pink"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill={getPathColor('semantic-similarity')} />
            </marker>
          </defs>

          {/* Routed Call annotation path */}
          {routedPath && (
            <path
              d={routedPath.d}
              stroke={getPathColor('routed-call')}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-blue)"
              className="drop-shadow-lg transition-colors duration-200"
            />
          )}

          {/* Baseline annotation path */}
          {baselinePath && (
            <path
              d={baselinePath.d}
              stroke={getPathColor('baseline-call')}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-green)"
              className="drop-shadow-lg transition-colors duration-200"
            />
          )}

          {/* Cost Savings forking paths */}
          {costSavingsPathTop && (
            <path
              d={costSavingsPathTop.d}
              stroke={getPathColor('cost-savings')}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-amber)"
              className="drop-shadow-lg transition-colors duration-200"
            />
          )}
          {costSavingsPathBottom && (
            <path
              d={costSavingsPathBottom.d}
              stroke={getPathColor('cost-savings')}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-amber)"
              className="drop-shadow-lg transition-colors duration-200"
            />
          )}

          {/* Unrouted Call annotation path */}
          {unroutedPath && (
            <path
              d={unroutedPath.d}
              stroke={getPathColor('unrouted-call')}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-purple)"
              className="drop-shadow-lg transition-colors duration-200"
            />
          )}

          {/* Semantic Similarity forking paths */}
          {semanticSimilarityPathTop && (
            <path
              d={semanticSimilarityPathTop.d}
              stroke={getPathColor('semantic-similarity')}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-pink)"
              className="drop-shadow-lg transition-colors duration-200"
            />
          )}
          {semanticSimilarityPathBottom && (
            <path
              d={semanticSimilarityPathBottom.d}
              stroke={getPathColor('semantic-similarity')}
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead-pink)"
              className="drop-shadow-lg transition-colors duration-200"
            />
          )}
        </svg>

        {/* Label elements positioned outside the chat column */}
        <div
          ref={routedLabelRef}
          className="absolute pointer-events-none"
          style={
            routedLabelPosition
              ? {
                  top: `${routedLabelPosition.top}px`,
                  left: `${routedLabelPosition.left}px`,
                }
              : { top: '305px', left: '-200px' }
          }
        >
          <HoverableSection section="routed-call">
            <div className="bg-white border border-border text-foreground px-4 py-2 rounded-lg shadow-lg font-semibold pointer-events-auto w-48">
              Routed Call
              <div className="text-xs font-normal mt-1 opacity-90">
                Smart routing to GPT-4o-mini
              </div>
            </div>
          </HoverableSection>
        </div>

        <div
          ref={baselineLabelRef}
          className="absolute pointer-events-none"
          style={
            baselineLabelPosition
              ? {
                  top: `${baselineLabelPosition.top}px`,
                  left: `${baselineLabelPosition.left}px`,
                }
              : { top: '665px', left: '-200px' }
          }
        >
          <HoverableSection section="baseline-call">
            <div className="bg-white border border-border text-foreground px-4 py-2 rounded-lg shadow-lg font-semibold pointer-events-auto w-48">
              Baseline
              <div className="text-xs font-normal mt-1 opacity-90">
                Claude Opus 4 default
              </div>
            </div>
          </HoverableSection>
        </div>

        <div
          ref={costSavingsLabelRef}
          className="absolute pointer-events-none"
          style={
            costSavingsLabelPosition
              ? {
                  top: `${costSavingsLabelPosition.top}px`,
                  left: `${costSavingsLabelPosition.left}px`,
                }
              : { top: '515px', left: '-200px' }
          }
        >
          <HoverableSection section="cost-savings">
            <div className="bg-white border border-border text-foreground px-4 py-2 rounded-lg shadow-lg font-semibold pointer-events-auto w-48">
              Cost Savings
              <div className="text-xs font-normal mt-1 opacity-90">
                Comparing both models
              </div>
            </div>
          </HoverableSection>
        </div>

        <div
          ref={unroutedLabelRef}
          className="absolute pointer-events-none"
          style={
            unroutedLabelPosition
              ? {
                  top: `${unroutedLabelPosition.top}px`,
                  right: `${unroutedLabelPosition.right}px`,
                }
              : { top: '100px', right: '-200px' }
          }
        >
          <HoverableSection section="unrouted-call">
            <div className="bg-white border border-border text-foreground px-4 py-2 rounded-lg shadow-lg font-semibold pointer-events-auto w-48">
              Unrouted Call
              <div className="text-xs font-normal mt-1 opacity-90">
                Claude Opus 4 direct
              </div>
            </div>
          </HoverableSection>
        </div>

        <div
          ref={semanticSimilarityLabelRef}
          className="absolute pointer-events-none"
          style={
            semanticSimilarityLabelPosition
              ? {
                  top: `${semanticSimilarityLabelPosition.top}px`,
                  right: `${semanticSimilarityLabelPosition.right}px`,
                }
              : { top: '400px', right: '-220px' }
          }
        >
          <HoverableSection section="semantic-similarity">
            <div className="bg-white border border-border text-foreground px-4 py-2 rounded-lg shadow-lg font-semibold pointer-events-auto w-48">
              Semantic Similarity
              <div className="text-xs font-normal mt-1 opacity-90">
                Comparing both messages
              </div>
            </div>
          </HoverableSection>
        </div>
      </div>
    </div>
  );
}

