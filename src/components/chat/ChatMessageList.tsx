'use client';

import React, { useEffect, useCallback } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Message } from '@/types/message';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { MessageBubble } from './MessageBubble';
import { AnimatePresence, motion } from 'framer-motion';

// Memoize MessageBubble at the top level
const MemoizedMessageBubble = React.memo(MessageBubble);

interface MessageGroup {
  messages: Message[];
  date: Date;
}

interface ChatMessageListProps {
  messageGroups: MessageGroup[];
  isLoading: boolean;
  error?: string;
  onDismissError: () => void;
  modelImage?: string | null;
}

export function ChatMessageList({
  messageGroups,
  isLoading,
  error,
  onDismissError,
  modelImage
}: ChatMessageListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!parentRef.current) return;
    parentRef.current.scrollTo({
      top: parentRef.current.scrollHeight,
      behavior
    });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messageGroups.length > 0) {
      scrollToBottom('instant');
    }
  }, [messageGroups, scrollToBottom]);

  // Handle scroll position
  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, []);

  useEffect(() => {
    const container = parentRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const rowVirtualizer = useVirtualizer({
    count: messageGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5
  });

  return (
    <div className="relative flex-1 h-full">
      <div 
        ref={parentRef}
        className="h-full overflow-y-auto scrollbar-pretty pb-4"
      >
        {error && (
          <div className="px-4 pt-4">
            <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismissError}
                className="mt-2 text-red-500 hover:text-red-400"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Virtualized Message Groups */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
          className="px-4"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const group = messageGroups[virtualRow.index];
            
            return (
              <div
                key={virtualRow.index}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className={cn(
                  "absolute top-0 left-0 w-full",
                  "transform transition-all duration-200"
                )}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Date Separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="text-xs text-white/40 bg-[#1a1a1a] px-3 py-1 rounded-full">
                    {format(group.date, 'MMMM d, yyyy')}
                  </div>
                </div>

                {/* Message Group */}
                <div className="space-y-2">
                  {group.messages.map((message, index) => (
                    <MemoizedMessageBubble
                      key={message.id}
                      message={message}
                      isRead={false}
                      modelImage={modelImage || null}
                      isLastInGroup={index === group.messages.length - 1}
                      showTimestamp={index === group.messages.length - 1}
                      timestamp={format(new Date(message.createdAt), 'h:mm a')}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Typing Indicator */}
        {isLoading && (
          <div className="px-4 py-2">
            <div className="flex items-center space-x-2 text-white/50 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI is typing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 right-4"
          >
            <Button
              size="icon"
              variant="secondary"
              onClick={() => scrollToBottom()}
              className="h-10 w-10 rounded-full bg-[#1a1a1a] hover:bg-[#2a2a2a] shadow-lg"
            >
              <ArrowDown className="h-5 w-5 text-white/70" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 