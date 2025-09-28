'use client';
import { useState, useEffect } from 'react';
import { CornerRightUp } from 'lucide-react';

export default function PromoPage() {
  const [typedText, setTypedText] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [animatingMessageIndex, setAnimatingMessageIndex] = useState<number | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const fullText = 'Thanks for the summary!';

  useEffect(() => {
    if (isTyping) {
      if (typedText.length < fullText.length) {
        const timeout = setTimeout(() => {
          setTypedText(fullText.slice(0, typedText.length + 1));
        }, 100);
        return () => clearTimeout(timeout);
      } else {
        // Typing complete, start sending animation
        setIsTyping(false);
        setIsSending(true);

        // Scale animation for send icon
        setTimeout(() => {
          setIsSending(false);
          // Add message and clear input
          setMessages(prev => {
            const newMessages = [...prev, fullText];
            setAnimatingMessageIndex(newMessages.length - 1);
            return newMessages;
          });
          setTypedText('');

          // Wait for message animation to complete (500ms), then brief pause (0.5s), then start fade out
          setTimeout(() => {
            setIsFadingOut(true);
            // After fade out completes (200ms), wait brief pause (0.5s), then reset
            setTimeout(() => {
              setMessages([]); // Clear all messages
              setAnimatingMessageIndex(null); // Reset animation state
              setIsFadingOut(false); // Reset fade state
              setIsTyping(true); // Start typing animation again
            }, 700); // 0.2s fade + 0.5s pause
          }, 1000); // 0.5s animation + 0.5s pause
        }, 500);
      }
    }
  }, [typedText, isTyping, fullText]);

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-black">
      {/* iPhone Container */}
      <div className={`relative w-80 h-[600px] border rounded-[3rem] p-2 transition-all duration-200 ${
        isFadingOut ? 'border-transparent' : 'border-white'
      }`}>
        <div className={`w-full h-full border rounded-[2.5rem] transition-all duration-200 ${
          isFadingOut ? 'border-transparent' : 'border-white'
        }`}>
          {/* Status Bar / Header */}
          <div className={`h-12 mb-4 transition-all duration-200 ${
            isFadingOut ? 'border-b-transparent' : 'border-b border-white'
          }`}>
            {/* Dynamic Island */}
          <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 w-32 h-4 border rounded-full transition-all duration-200 ${
            isFadingOut ? 'border-transparent' : 'border-white'
          }`}></div>
          </div>

          {/* Content Area */}
          <div className="flex flex-col w-full h-[85%] p-4">
            {/* Messages */}
            <div className="flex-1 overflow-none mb-4 relative">
              {messages.map((message, index) => (
                <div key={index} className="mb-2 relative">
                  <div className="relative ml-auto max-w-xs">
                    <div
                      className={`absolute right-0 transition-all duration-500 ease-out z-10 ${
                        animatingMessageIndex === index
                          ? 'animate-fade-in-up'
                          : ''
                      }`}
                    >
                      <div className="text-xs text-white mb-1 max-w-xs text-right">user</div>
                      <div className="p-3 border border-white text-white rounded-l-lg rounded-t-lg">
                        {message}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Text Input Mock */}
            <div className={`flex items-center h-12 border rounded-lg w-full px-3 transition-all duration-200 ${
              isFadingOut ? 'border-transparent' : 'border-white'
            }`}>
              <span className={`flex-1 transition-all duration-200 ${
                isFadingOut ? 'text-transparent' : 'text-white'
              }`}>{typedText}</span>
              <div className={`w-8 h-8 border rounded-full flex items-center justify-center transition-all duration-200 ${
                isFadingOut ? 'border-transparent' : 'border-white'
              }`}>
              <CornerRightUp
                  size={16}
                  className={`transition-all duration-200 ${
                    isFadingOut ? 'text-transparent' : 'text-white'
                  } transition-transform duration-300 ${
                    isSending ? 'scale-115' : 'scale-100'
                  }`}
                  strokeWidth={1.25}
                />
              </div>
            </div>
          </div> 
        </div>
      </div>
    </div>
  );
}
