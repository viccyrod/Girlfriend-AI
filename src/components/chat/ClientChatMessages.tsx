'use client';

import React, { useState, useRef, useEffect, useReducer, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, ArrowDown } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { format, isSameDay } from 'date-fns';
import { useVirtualizer } from '@tanstack/react-virtual';

// Utility function to debounce function calls
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Message state interface
interface MessageState {
  newMessage: string;
  isLoading: boolean;
  showScrollButton: boolean;
  streamingContent: string;
  error?: string;
}

// Message state actions
type MessageAction = 
  | { type: 'SET_NEW_MESSAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SCROLL_BUTTON'; payload: boolean }
  | { type: 'APPEND_STREAM'; payload: string }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Message state reducer
function messageStateReducer(state: MessageState, action: MessageAction): MessageState {
  switch (action.type) {
    case 'SET_NEW_MESSAGE':
      return { ...state, newMessage: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_SCROLL_BUTTON':
      return { ...state, showScrollButton: action.payload };
    case 'APPEND_STREAM':
      return { 
        ...state, 
        streamingContent: state.streamingContent + action.payload 
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: undefined };
    default:
      return state;
  }
}

// Utility function to create a new message
function createMessage({
  content,
  chatRoomId,
  isAIMessage,
  aiModelId
}: {
  content: string;
  chatRoomId: string;
  isAIMessage: boolean;
  aiModelId: string;
}): Message {
  return {
    id: Date.now().toString(),
    content,
    chatRoomId,
    createdAt: new Date(),
    updatedAt: new Date(),
    isAIMessage,
    metadata: { type: 'text' },
    userId: null,
    aiModelId,
    role: isAIMessage ? 'assistant' : 'user',
    user: null
  };
}

// Props interface
interface ClientChatMessagesProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedRoom: ExtendedChatRoom | null;
  model?: ExtendedChatRoom['aiModel'];
}

// Utility to group messages by date and sender
function groupMessages(messages: Message[]) {
  // Sort messages by date first
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  const groups: Message[][] = [];
  let currentGroup: Message[] = [];

  sortedMessages.forEach((message, index) => {
    const prevMessage = sortedMessages[index - 1];
    
    const shouldStartNewGroup = () => {
      if (!prevMessage) return true;
      
      const timeDiff = Math.abs(
        new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()
      );
      const isNewDay = !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));
      const isDifferentSender = message.isAIMessage !== prevMessage.isAIMessage;
      
      return isNewDay || isDifferentSender || timeDiff > 5 * 60 * 1000; // 5 minutes
    };

    if (shouldStartNewGroup()) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [message];
    } else {
      currentGroup.push(message);
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

function ClientChatMessages({ 
  messages, 
  setMessages, 
  selectedRoom,
  model 
}: ClientChatMessagesProps) {
  const [state, dispatch] = useReducer(messageStateReducer, {
    newMessage: '',
    isLoading: false,
    showScrollButton: false,
    streamingContent: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    dispatch({ type: 'SET_SCROLL_BUTTON', payload: !isNearBottom });
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!messagesEndRef.current) return;
    
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior
    });
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    if (!state.showScrollButton) {
      const timeoutId = setTimeout(() => scrollToBottom('instant'), 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, state.showScrollButton, scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const debouncedScroll = debounce(handleScroll, 100);
    container.addEventListener('scroll', debouncedScroll);
    return () => container.removeEventListener('scroll', debouncedScroll);
  }, [handleScroll]);

  const handleSendMessage = async (content: string) => {
    if (!selectedRoom?.id || !content.trim() || state.isLoading) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const userMessage = createMessage({
        content: content.trim(),
        chatRoomId: selectedRoom.id,
        isAIMessage: false,
        aiModelId: selectedRoom.aiModelId
      });
      setMessages(prev => [...prev, userMessage]);

      const response = await fetch(`/api/chat/${selectedRoom.id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
        signal: abortController.signal
      });

      if (!response.ok) throw new Error('Failed to send message');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const aiMessage = createMessage({
        content: '',
        chatRoomId: selectedRoom.id,
        isAIMessage: true,
        aiModelId: selectedRoom.aiModelId
      });
      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('event: message')) continue;
          
          const dataLine = lines[lines.indexOf(line) + 1];
          if (!dataLine?.startsWith('data: ')) continue;
          
          const data = JSON.parse(dataLine.slice(6));
          if (data.type === 'chunk') {
            dispatch({ type: 'APPEND_STREAM', payload: data.content });
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: msg.content + data.content }
                : msg
            ));
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Message streaming aborted');
          return;
        }
        console.error('Error sending message:', error);
        dispatch({ type: 'SET_ERROR', payload: error.message });
      } else {
        console.error('Unknown error:', error);
        dispatch({ type: 'SET_ERROR', payload: 'An unknown error occurred' });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isLoading || !state.newMessage.trim()) return;
    
    await handleSendMessage(state.newMessage.trim());
    dispatch({ type: 'SET_NEW_MESSAGE', payload: '' });
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_NEW_MESSAGE', payload: e.target.value });
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Group messages and memoize to prevent unnecessary recalculations
  const messageGroups = useMemo(() => groupMessages(messages), [messages]);

  // Virtual list for performance with large message lists
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: messageGroups.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 100, []),
    overscan: 5
  });

  // Scroll to bottom whenever messages change or when loading state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, state.isLoading]);

  // Auto scroll when new message is added
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      scrollToBottom('smooth');
    }
  }, [messages.length]);

  // Scroll to bottom when component mounts
  useEffect(() => {
    scrollToBottom('instant');
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-pretty"
      >
        {/* Error Message */}
        {state.error && (
          <div className="p-4 mb-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-500 text-sm">{state.error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              className="mt-2 text-red-500 hover:text-red-400"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Virtualized Message Groups */}
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const messageGroup = messageGroups[virtualRow.index];
            const firstMessage = messageGroup[0];
            
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
                    {format(new Date(firstMessage.createdAt), 'MMMM d, yyyy')}
                  </div>
                </div>

                {/* Message Group */}
                <div className="space-y-1">
                  {messageGroup.map((message, index) => (
                    <MemoizedMessageBubble
                      key={message.id}
                      message={message}
                      isRead={false}
                      modelImage={model?.imageUrl || selectedRoom?.aiModel?.imageUrl || null}
                      isLastInGroup={index === messageGroup.length - 1}
                      showTimestamp={index === messageGroup.length - 1}
                      timestamp={format(new Date(message.createdAt), 'h:mm a')}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Typing Indicator */}
        {state.isLoading && (
          <div className="flex items-center space-x-2 text-white/50 text-sm mt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} className="h-px w-full" />
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-white/5 bg-[#0f0f0f] p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={state.newMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                "w-full resize-none",
                "px-4 py-3 rounded-xl",
                "bg-[#1a1a1a] border border-white/10",
                "focus:outline-none focus:ring-2 focus:ring-pink-500/20",
                "placeholder:text-white/20",
                "text-white",
                "min-h-[48px] max-h-[120px]",
                "transition-all duration-200",
                state.isLoading && "opacity-50"
              )}
              disabled={state.isLoading}
            />

            {/* Character Count */}
            <div className="absolute right-3 bottom-3 text-xs text-white/30">
              {state.newMessage.length}/4000
            </div>
          </div>
          <Button
            type="submit"
            disabled={!state.newMessage.trim() || state.isLoading || state.newMessage.length > 4000}
            className={cn(
              "h-12 px-4 rounded-xl",
              "bg-gradient-to-r from-pink-500 to-purple-600",
              "text-white font-medium",
              "transition-all duration-200",
              "disabled:opacity-50",
              "relative overflow-hidden",
              "hover:shadow-lg hover:shadow-pink-500/20",
              "group"
            )}
          >
            {state.isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

// Memoized MessageBubble component to prevent unnecessary re-renders
const MemoizedMessageBubble = React.memo(MessageBubble);

// Export the memoized component
export default React.memo(ClientChatMessages);
