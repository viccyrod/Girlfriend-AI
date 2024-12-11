'use client';

import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { Message } from '@/types/message';
import { format } from 'date-fns';
import { MessageBubble } from './MessageBubble';
import { ChatImageMessage } from './ChatImageMessage';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ChatMessageListProps {
  messages: Message[];
  modelImage?: string | null;
}

export function ChatMessageList({ messages, modelImage }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom('instant');
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const behavior = lastMessage.metadata?.type === 'image' || !lastMessage.isAIMessage ? 'instant' : 'smooth';
      scrollToBottom(behavior);
    }
  }, [messages, scrollToBottom]);

  // Sort messages by createdAt
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messages]);

  const renderMessage = (message: Message) => {
    // Handle image messages
    if (message.metadata?.type === 'image') {
      return (
        <div className={cn(
          "flex items-start gap-3 w-full",
          message.isAIMessage ? "justify-start" : "justify-end"
        )}>
          {message.isAIMessage && modelImage && (
            <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden">
              <Image
                src={modelImage}
                alt="AI Avatar"
                width={32}
                height={32}
                className="object-cover"
                sizes="32px"
              />
            </div>
          )}
          <div className="max-w-[80%] w-full">
            <ChatImageMessage message={message} />
          </div>
        </div>
      );
    }

    // Regular text messages
    return (
      <MessageBubble
        message={message}
        isRead={true}
        modelImage={modelImage || null}
        isLastInGroup={true}
        showTimestamp={true}
        timestamp={format(new Date(message.createdAt), 'h:mm a')}
      />
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-pretty px-4"
      >
        <div className="max-w-3xl mx-auto py-4 space-y-4">
          {sortedMessages.map((message) => (
            <div key={message.id} className="message-container">
              {renderMessage(message)}
            </div>
          ))}
          <div ref={messagesEndRef} style={{ height: 1 }} />
        </div>
      </div>
    </div>
  );
} 