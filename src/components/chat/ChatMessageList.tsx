'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Message } from '@/types/message';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import { MessageBubble } from './MessageBubble';
import { AnimatePresence, motion } from 'framer-motion';

// Memoize MessageBubble at the top level
const MemoizedMessageBubble = React.memo(MessageBubble, (prev, next) => {
  // Custom comparison function for better memoization
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.isRead === next.isRead &&
    prev.modelImage === next.modelImage &&
    prev.isLastInGroup === next.isLastInGroup &&
    prev.showTimestamp === next.showTimestamp &&
    prev.timestamp === next.timestamp
  );
});

// Memoized date formatter to prevent unnecessary format operations
const formatMessageDate = (date: Date | string) => {
  const d = new Date(date);
  return format(d, 'MMMM d, yyyy');
};

const formatMessageTime = (date: Date | string) => {
  const d = new Date(date);
  return format(d, 'h:mm a');
};

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
  modelName?: string;
}

export function ChatMessageList({
  messageGroups,
  isLoading,
  error,
  onDismissError,
  modelImage,
  modelName = 'AI'
}: ChatMessageListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = React.useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!parentRef.current) return;
    setIsAutoScrolling(true);
    parentRef.current.scrollTo({
      top: parentRef.current.scrollHeight,
      behavior
    });
    // Reset auto-scroll flag after animation
    setTimeout(() => setIsAutoScrolling(false), behavior === 'smooth' ? 300 : 0);
  }, []);

  // Auto-scroll on new messages if near bottom
  useEffect(() => {
    if (!parentRef.current || messageGroups.length === 0) return;
    
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
    
    if (isNearBottom || isAutoScrolling) {
      scrollToBottom('instant');
    }
  }, [messageGroups, scrollToBottom, isAutoScrolling]);

  // Optimized scroll handler with debounce
  const handleScroll = useCallback(() => {
    if (!parentRef.current || isAutoScrolling) return;
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  }, [isAutoScrolling]);

  useEffect(() => {
    const container = parentRef.current;
    if (!container) return;

    let timeoutId: NodeJS.Timeout;
    const debouncedScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    container.addEventListener('scroll', debouncedScroll);
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('scroll', debouncedScroll);
    };
  }, [handleScroll]);

  // Optimized virtualizer configuration
  const rowVirtualizer = useVirtualizer({
    count: messageGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 100, []),
    overscan: 5,
    paddingStart: 16, // Add padding to prevent clipping
    paddingEnd: 16
  });

  // Memoized error component
  const errorComponent = useMemo(() => {
    if (!error) return null;
    return (
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="px-4 pt-4"
      >
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
      </motion.div>
    );
  }, [error, onDismissError]);

  return (
    <div className="relative flex-1 h-full">
      <div 
        ref={parentRef}
        className="h-full overflow-y-auto scrollbar-pretty pb-6"
      >
        <AnimatePresence>
          {errorComponent}
        </AnimatePresence>

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
                <div className="flex items-center justify-center my-6">
                  <div className="text-xs text-white/40 bg-[#1a1a1a] px-3 py-1.5 rounded-full">
                    {formatMessageDate(group.date)}
                  </div>
                </div>

                {/* Message Group */}
                <div className="space-y-3">
                  {group.messages.map((message, index, array) => {
                    const isFirstInGroup = index === 0;
                    const isLastInGroup = index === array.length - 1;
                    const prevMessage = array[index - 1];
                    const nextMessage = array[index + 1];
                    const timeDiffFromPrev = prevMessage
                      ? new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()
                      : 0;
                    const timeDiffToNext = nextMessage
                      ? new Date(nextMessage.createdAt).getTime() - new Date(message.createdAt).getTime()
                      : 0;
                    
                    // Add extra spacing if messages are more than 2 minutes apart
                    const shouldAddSpacingBefore = timeDiffFromPrev > 2 * 60 * 1000;
                    const shouldAddSpacingAfter = timeDiffToNext > 2 * 60 * 1000;

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          shouldAddSpacingBefore && "mt-6",
                          shouldAddSpacingAfter && "mb-6"
                        )}
                      >
                        <MemoizedMessageBubble
                          key={message.id}
                          message={message}
                          isRead={false}
                          modelImage={modelImage || null}
                          isLastInGroup={isLastInGroup}
                          showTimestamp={isLastInGroup || shouldAddSpacingAfter}
                          timestamp={formatMessageTime(message.createdAt)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Typing Indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="px-4 py-3"
            >
              <div className="flex items-center space-x-2.5 text-white/50 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{modelName} is typing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scroll to Bottom Button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-6 right-4"
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