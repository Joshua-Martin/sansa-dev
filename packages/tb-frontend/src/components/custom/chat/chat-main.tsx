'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Plus } from 'lucide-react';
import { Button } from '../../common/button';
import { cn } from '../../../lib/utils/utils';
import { useChatAgent } from '../../../hooks/useChatAgent';
import ChatInterface from './chat-interface';
import ChatThreadList from './chat-thread-list';
import type { LLMMessage } from '../../../../../tb-shared/src';
import { AIProvider } from '../../../../../tb-shared/src';

/**
 * Promo dev mode flag
 */
const isPromoDev = true;

/**
 * Promo comparison data structure (for fake messages only)
 */
interface PromoComparisonData {
  defaultModel: string;
  defaultProvider: AIProvider;
  defaultContent: string;
  defaultTokenCountInput: number;
  defaultTokenCountOutput: number;
  defaultTokenCostInput: number;
  defaultTokenCostOutput: number;
  defaultMessageCost: number;
}

/**
 * Extended message type for promo mode (internal use only)
 */
type PromoLLMMessage = LLMMessage & { promoComparison?: PromoComparisonData };

/**
 * Fake messages for promo dev mode
 * Note: Last message includes promoComparison data for demo purposes
 */
const fakeMessages: LLMMessage[] = [
  {
    "threadId": "7e20563e-dbc5-4a4f-9da0-d018613a7cc0",
    "role": "user",
    "content": "Please give me a summary of brown vs board of education",
    "status": "completed",
    "model": "gpt-4o-mini",
    "provider": AIProvider.OPEN_AI,
    "tokenCountInput": 14,
    "tokenCountOutput": 0,
    "tokenCostInput": 0.000002,
    "tokenCostOutput": 0.000000,
    "messageCost": 0.000002,
    "id": "954fb0d1-3e81-4013-95c7-339927b32fcb",
    "createdAt": new Date("2025-10-07T12:19:59.980Z"),
    "updatedAt": new Date("2025-10-07T12:19:59.980Z")
  },
  {
    "id": "e8ad6dde-ef34-445d-8ded-47be58807480",
    "threadId": "7e20563e-dbc5-4a4f-9da0-d018613a7cc0",
    "role": "assistant",
    "content": "\"Brown v. Board of Education\" was a landmark Supreme Court case decided in 1954. It challenged the legality of racial segregation in public schools. The case combined several different lawsuits from various states, all arguing that segregated schools were inherently unequal and violated the Equal Protection Clause of the 14th Amendment.\n\nThe Supreme Court, led by Chief Justice Earl Warren, unanimously ruled that \"separate but equal\" educational facilities were inherently unequal, thus unconstitutional. This decision effectively overturned the precedent set by \"Plessy v. Ferguson\" in 1896, which upheld segregation. The ruling mandated the desegregation of public schools across America, marking a significant victory for the Civil Rights Movement and setting the stage for further challenges to racial discrimination. The case highlighted the detrimental effects of segregation on African American children and aimed to promote equality in education. Overall, \"Brown v. Board of Education\" was a pivotal moment in the fight against racial injustice in the United States.",
    "status": "completed",
    "model": "claude-opus-4",
    "provider": AIProvider.ANTHROPIC,
    "tokenCountInput": 436,
    "tokenCountOutput": 201,
    "tokenCostInput": 0.000065,
    "tokenCostOutput": 0.000121,
    "messageCost": 0.0576,
    "createdAt": new Date("2025-10-07T12:19:59.984Z"),
    "updatedAt": new Date("2025-10-07T12:20:03.159Z") 
  },
  {
    "threadId": "7e20563e-dbc5-4a4f-9da0-d018613a7cc0",
    "role": "user",
    "content": "thanks",
    "status": "completed",
    "model": "gpt-4o-mini",
    "provider": AIProvider.OPEN_AI,
    "tokenCountInput": 2,
    "tokenCountOutput": 0,
    "tokenCostInput": 0.000000,
    "tokenCostOutput": 0.000000,
    "messageCost": 0.000000,
    "id": "7a65103d-f896-4729-b1dd-c99a1088b4b2",
    "createdAt": new Date("2025-10-07T12:20:11.976Z"),
    "updatedAt": new Date("2025-10-07T12:20:11.976Z")
  },
  {
    "id": "a42ac97e-3f4d-4ae6-aac4-0672792aa4cb",
    "threadId": "7e20563e-dbc5-4a4f-9da0-d018613a7cc0",
    "role": "assistant",
    "content": "You're welcome! If you have any more questions or need further information, feel free to ask!",
    "status": "completed",
    "model": "gpt-4o-mini",
    "provider": AIProvider.OPEN_AI,
    "tokenCountInput": 645,
    "tokenCountOutput": 25,
    "tokenCostInput": 0.000097,
    "tokenCostOutput": 0.000015,
    "messageCost": 0.000112,
    "createdAt": new Date("2025-10-07T12:20:11.980Z"),
    "updatedAt": new Date("2025-10-07T12:20:14.224Z"),
    // Promo mode comparison data
    "promoComparison": {
      "defaultModel": "claude-opus-4",
      "defaultProvider": AIProvider.ANTHROPIC,
      "defaultContent": "You're welcome! If you have any more questions or need further information, feel free to ask!",
      "defaultTokenCountInput": 645,
      "defaultTokenCountOutput": 25,
      "defaultTokenCostInput": 0.009675,
      "defaultTokenCostOutput": 0.001875,
      "defaultMessageCost": 0.01155
    }
  } as PromoLLMMessage
];

/**
 * Props for ChatMain component
 */
export interface ChatMainProps {
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * ChatMain Component
 *
 * Main chat component that prioritizes the chat interface with an optional
 * sidebar overlay for thread management. The chat is the primary feature,
 * with thread management as a secondary overlay.
 */
export const ChatMain: React.FC<ChatMainProps> = ({ className }) => {
  const [showThreadSidebar, setShowThreadSidebar] = useState(false);

  const {
    // Connection state
    connectionState,
    isConnected,

    // Threads
    threads,
    activeThreadId,
    isLoadingThreads,
    isCreatingThread,

    // Messages
    messages,
    streamingMessage,
    isLoadingMessages,
    isSendingMessage,

    // General error
    error,

    // Actions
    connect,
    clearError,
    createThread,
    selectThread,
    sendMessage,
  } = useChatAgent();

  /**
   * Connect to WebSocket when component mounts (if not already connected)
   */
  useEffect(() => {
    if (connectionState === 'disconnected') {
      connect().catch((error) => {
        console.error('Failed to connect to chat agent:', error);
      });
    }
  }, [connect, connectionState]);

  /**
   * Handle sending a message with UI state
   */
  const handleSendMessage = async (message: string, uiState?: string) => {
    const currentUiState =
      uiState ||
      JSON.stringify({
        page: 'builder',
        timestamp: new Date().toISOString(),
        activeThreadId,
      });

    await sendMessage(message, currentUiState);
  };

  /**
   * Handle thread selection
   */
  const handleThreadSelect = async (threadId: string) => {
    await selectThread(threadId);
    setShowThreadSidebar(false); // Close sidebar after selection
  };

  /**
   * Handle creating new thread
   */
  const handleCreateThread = async () => {
    await createThread();
    setShowThreadSidebar(false); // Close sidebar after creation
  };

  /**
   * Toggle thread sidebar
   */
  const toggleThreadSidebar = () => {
    setShowThreadSidebar(!showThreadSidebar);
  };

  return (
    <div
      className={cn(
        'max-h-screen h-full flex relative bg-background',
        className
      )}
    >
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header with menu button */}
        <div className="flex items-center justify-between p-2 pt-4 border-b bg-background border-border">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleThreadSidebar}
              className="h-8 w-8 p-0"
            >
              {showThreadSidebar ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              <span className="sr-only">
                {showThreadSidebar ? 'Close menu' : 'Open menu'}
              </span>
            </Button>
          </div>

          {/* New chat button */}
          <Button
            onClick={handleCreateThread}
            disabled={isCreatingThread}
            size="icon"
            variant="ghost"
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New chat</span>
          </Button>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            messages={isPromoDev ? fakeMessages : messages}
            streamingMessage={streamingMessage}
            isLoadingMessages={isLoadingMessages}
            isSendingMessage={isSendingMessage}
            isConnected={isConnected}
            error={error}
            onSendMessage={handleSendMessage}
            onClearError={clearError}
          />
        </div>
      </div>

      {/* Thread Sidebar Overlay */}
      {showThreadSidebar && (
        <>
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 z-40"
            onClick={() => setShowThreadSidebar(false)}
          />

          {/* Sidebar */}
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-background border-r shadow-lg z-50">
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    Conversations
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowThreadSidebar(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>
              </div>

              {/* Thread List */}
              <div className="flex-1 overflow-hidden">
                <ChatThreadList
                  threads={threads}
                  activeThreadId={activeThreadId}
                  isLoading={isLoadingThreads}
                  isCreatingThread={isCreatingThread}
                  onThreadSelect={handleThreadSelect}
                  onCreateThread={handleCreateThread}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatMain;
