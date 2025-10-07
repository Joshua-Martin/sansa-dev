'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';
import type { LLMMessage } from '../../../../../tb-shared/src';
import { cn } from '../../../lib/utils/utils';
import { MarkdownRenderer } from '../../common/markdown-renderer';

/**
 * Props for ChatMessage component
 */
export interface ChatMessageProps {
  /**
   * The message data
   */
  message: LLMMessage;

  /**
   * Whether this message is currently being streamed
   */
  isStreaming?: boolean;

  /**
   * Streaming content for incomplete messages
   */
  streamingContent?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

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
 * Type guard to check if a message has promo comparison data
 *
 * @param message - The message to check
 * @returns True if the message has promo comparison data
 */
const hasPromoComparison = (
  message: LLMMessage
): message is LLMMessage & { promoComparison: PromoComparisonData } => {
  return 'promoComparison' in message;
};

/**
 * ChatMessage Component
 *
 * Renders a single chat message with appropriate styling based on the role
 * (user, assistant, or system). Supports streaming content for real-time updates.
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  streamingContent,
  className,
}) => {
  const isPromo = true;

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  // Use streaming content if available, otherwise use message content
  const displayContent =
    isStreaming && streamingContent !== undefined
      ? streamingContent
      : message.content;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const calculateSavingsPercentage = (
    inputTokens: number,
    outputTokens: number,
    actualCost: number
  ): number => {
    // Calculate what it would cost at standard rates: $15/M input, $75/M output
    const standardCost = (inputTokens * 15 + outputTokens * 75) / 1000000;
    // Calculate savings percentage
    const savings = ((standardCost - actualCost) / standardCost) * 100;
    return Math.round(savings * 100) / 100; // Round to 2 decimal places
  };

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
        // Fallback to OpenAI logo for unknown providers
        return '/ai-logos/openai.png';
    }
  };

  useEffect(() => {
    console.log(JSON.stringify(message, null, 2));
  }, [message]);

  // Don't render empty assistant messages unless they're streaming
  // Exception: Show pending assistant messages that might receive streaming content
  if (
    isAssistant &&
    !displayContent &&
    !isStreaming &&
    message.status !== 'pending'
  ) {
    return null;
  }

  return (
    <div className={cn('flex gap-2 px-4 py-3 m-2', className)}>
      {/* System messages: keep existing styling */}
      {isSystem && (
        <div className="mx-4 bg-yellow-50 dark:bg-yellow-950/20 text-sm rounded-lg">
          {displayContent}
        </div>
      )}

      {/* User messages */}
      {isUser && (
        <>
          {/* Empty space to align with assistant message stats */}
          <div className="flex-[0_0_25%]"></div>
          <div className="bg-primary dark:bg-muted dark:border dark:border-border rounded-xl ml-auto w-fit text-primary-foreground dark:text-foreground px-3 py-2">
            <span>{displayContent}</span>
          </div>
        </>
      )}

      {/* Assistant messages */}
      {isAssistant && (
        <>
          {/* Check if this is a promo comparison message */}
          {isPromo && hasPromoComparison(message) ? (
            // Stacked comparison view - routed model on top, default below
            <div className="flex-1 space-y-2">
              {/* Routed Model (GPT-4o-mini) - normal styling */}
              <div className="flex gap-2">
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
                        <span>{formatNumber(message.tokenCountOutput)}</span>
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
                        <span>
                          {formatCurrency(message.messageCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message content */}
                <div className="flex-1 bg-muted border border-border rounded-lg px-3 py-2">
                  <div className="text-foreground">
                    <MarkdownRenderer
                      content={displayContent || ''}
                      className={cn(
                        'prose prose-sm max-w-none dark:prose-invert',
                        '[&_*]:text-current [&_.text-primary]:text-current [&_.text-primary-foreground]:text-current'
                      )}
                    />
                  </div>
                </div>
              </div>
   

              {/* Default Model (Claude Opus 4) - normal styling */}
                <div className="flex gap-2">
                {/* Message stats */}
                <div className="flex-[0_0_25%] bg-muted border border-border rounded-lg px-3 py-2 text-foreground">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Image
                        src={getProviderLogo(
                          message.promoComparison.defaultProvider
                        )}
                        alt={`${message.promoComparison.defaultProvider} logo`}
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain rounded-full"
                      />
                      <span className="text-xs text-foreground font-medium">
                        {message.promoComparison.defaultModel}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground">Cost:</span>
                      <span>
                        {formatCurrency(
                          message.promoComparison.defaultMessageCost
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message content */}
                <div className="flex-1 bg-muted border border-border rounded-lg px-3 py-2">
                  <div className="text-foreground">
                    <MarkdownRenderer
                      content={message.promoComparison.defaultContent}
                      className={cn(
                        'prose prose-sm max-w-none dark:prose-invert',
                        '[&_*]:text-current [&_.text-primary]:text-current [&_.text-primary-foreground]:text-current'
                      )}
                    />
                  </div>
                </div>
                </div>
      
            </div>
          ) : (
            // Normal assistant message view (no comparison)
            <>
              {/* Assistant message stats or placeholder for alignment */}
              {message.status === 'completed' ? (
                <div className="flex-[0_0_25%] bg-muted border border-border rounded-lg px-3 py-2 text-foreground">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Image
                        src={getProviderLogo(
                          isPromo && message.tokenCountOutput > 100
                            ? 'anthropic'
                            : message.provider
                        )}
                        alt={`${isPromo && message.tokenCountOutput > 100 ? 'anthropic' : message.provider} logo`}
                        width={20}
                        height={20}
                        className="h-5 w-5 object-contain rounded-full"
                      />
                      <span className="text-xs text-foreground font-medium">
                        {isPromo && message.tokenCountOutput > 100
                          ? 'claude-opus-4'
                          : message.model}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground">Input:</span>
                        <span>
                          {formatNumber(
                            isPromo && message.tokenCountOutput > 100
                              ? message.tokenCountInput + 2400
                              : message.tokenCountInput
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground">Output:</span>
                        <span>{formatNumber(message.tokenCountOutput)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-border pt-1">
                        <span className="text-foreground">Total:</span>
                        <span>
                          {formatNumber(
                            isPromo && message.tokenCountOutput > 100
                              ? message.tokenCountInput +
                                  2400 +
                                  message.tokenCountOutput
                              : message.tokenCountInput +
                                  message.tokenCountOutput
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-border pt-1">
                        <span className="text-foreground">Cost:</span>
                        <span>
                          {isPromo && message.tokenCountOutput > 100
                            ? formatCurrency(
                                ((message.tokenCountInput + 2400) * 15 +
                                  message.tokenCountOutput * 75) /
                                  1000000
                              )
                            : formatCurrency(message.messageCost)}
                        </span>
                      </div>
                      {isPromo && message.tokenCountOutput < 100 && (
                        <div className="flex items-center justify-between text-xs border-t border-border pt-1">
                          <span className="text-foreground">Savings:</span>
                          <span className="text-green-600 font-medium">
                            {calculateSavingsPercentage(
                              message.tokenCountInput,
                              message.tokenCountOutput,
                              message.messageCost
                            )}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-[0_0_25%]"></div>
              )}

              {/* Message content */}
              <div className="flex-1 bg-muted border border-border rounded-lg px-3 py-2">
                <div className="text-foreground">
                  <MarkdownRenderer
                    content={displayContent || ''}
                    className={cn(
                      'prose prose-sm max-w-none dark:prose-invert',
                      // Additional styling for chat messages
                      '[&_*]:text-current [&_.text-primary]:text-current [&_.text-primary-foreground]:text-current'
                    )}
                  />
                  {isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ChatMessage;
