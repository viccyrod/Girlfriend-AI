'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, ArrowDown } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { Message } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ClientChatMessagesProps {
  chatRoom: ExtendedChatRoom;
  onSendMessage: (content: string) => Promise<void>;
  messages: Message[];
}

export default function ClientChatMessages({ 
  chatRoom, 
  onSendMessage,
  messages
}: ClientChatMessagesProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollHeight, scrollTop, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (!showScrollButton) {
      scrollToBottom('instant');
    }
  }, [messages, showScrollButton]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isLoading) return;

    try {
      setIsLoading(true);
      await onSendMessage(newMessage.trim());
      setNewMessage('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      scrollToBottom('instant');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-pretty"
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isRead={false}
            modelImage={chatRoom.aiModel?.imageUrl || null}
            isLastMessage={index === messages.length - 1}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-20 right-4 h-10 w-10 rounded-full shadow-lg bg-background/95 backdrop-blur border border-border hover:bg-background"
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
      )}

      {/* Input Area */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                "w-full resize-none",
                "px-4 py-3 rounded-xl",
                "bg-background/50 border border-primary/10",
                "focus:outline-none focus:ring-2 focus:ring-pink-500/20",
                "placeholder:text-muted-foreground/50",
                "min-h-[48px] max-h-[200px]"
              )}
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className={cn(
              "h-12 px-4 rounded-xl",
              "bg-pink-500 hover:bg-pink-600",
              "text-white font-medium",
              "transition-all duration-200",
              "disabled:opacity-50",
              "relative overflow-hidden",
              "group"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
