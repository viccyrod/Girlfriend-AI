import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types/message';

interface UseVirtualMessagesOptions {
  messages: Message[];
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
  onLoadMore?: () => Promise<void>;
  loadMoreThreshold?: number;
  initialScrollBehavior?: ScrollBehavior;
}

export const useVirtualMessages = ({
  messages,
  itemHeight = 120,
  overscan = 3,
  containerHeight,
  onLoadMore,
  loadMoreThreshold = 200,
  initialScrollBehavior = 'auto'
}: UseVirtualMessagesOptions) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  const lastScrollTop = useRef(0);
  const rafId = useRef<number>();
  const isAutoScrolling = useRef(false);
  const lastMessageCount = useRef(messages.length);

  const getVisibleRange = useCallback(() => {
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      messages.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    return { startIndex, endIndex };
  }, [messages.length, itemHeight, overscan, scrollTop, containerHeight]);

  const updateVisibleMessages = useCallback(() => {
    if (!containerRef.current) return;
    
    const { startIndex, endIndex } = getVisibleRange();
    setVisibleMessages(messages.slice(startIndex, endIndex));
  }, [messages, getVisibleRange]);

  const handleScroll = useCallback(async (event: Event) => {
    if (isAutoScrolling.current) return;

    const target = event.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    lastScrollTop.current = newScrollTop;

    // Use requestAnimationFrame for smooth scrolling
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    rafId.current = requestAnimationFrame(() => {
      setScrollTop(newScrollTop);

      // Check if we need to load more messages
      if (onLoadMore && !isLoadingMore.current && newScrollTop < loadMoreThreshold) {
        isLoadingMore.current = true;
        onLoadMore().finally(() => {
          isLoadingMore.current = false;
        });
      }
    });
  }, [onLoadMore, loadMoreThreshold]);

  // Scroll position restoration
  const scrollToMessage = useCallback((messageId: string, behavior: ScrollBehavior = 'smooth') => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex !== -1 && containerRef.current) {
      isAutoScrolling.current = true;
      containerRef.current.scrollTo({
        top: messageIndex * itemHeight,
        behavior
      });
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, behavior === 'smooth' ? 300 : 0);
    }
  }, [messages, itemHeight]);

  // Auto-scroll to bottom for new messages
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (containerRef.current) {
      isAutoScrolling.current = true;
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior
      });
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, behavior === 'smooth' ? 300 : 0);
    }
  }, []);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      const container = containerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        if (isNearBottom) {
          scrollToBottom(initialScrollBehavior);
        }
      }
    }
    lastMessageCount.current = messages.length;
  }, [messages.length, scrollToBottom, initialScrollBehavior]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll]);

  useEffect(() => {
    updateVisibleMessages();
  }, [updateVisibleMessages, messages]);

  const totalHeight = messages.length * itemHeight;
  const { startIndex } = getVisibleRange();
  const offsetY = Math.max(0, startIndex * itemHeight);

  return {
    containerRef,
    visibleMessages,
    totalHeight,
    offsetY,
    scrollToMessage,
    scrollToBottom,
    style: {
      height: containerHeight,
      overflow: 'auto',
      position: 'relative' as const,
      willChange: 'transform',
      WebkitOverflowScrolling: 'touch' as const,
    },
    innerStyle: {
      height: Math.max(messages.length * (itemHeight + 8), containerHeight),
      position: 'relative' as const,
      willChange: 'transform',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: messages.length * (itemHeight + 8) < containerHeight ? 'flex-end' as const : 'flex-start' as const,
    },
    itemStyle: (index: number) => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      width: '100%',
      transform: `translateY(${index * (itemHeight + 8)}px)`,
      willChange: 'transform',
    }),
  };
}; 