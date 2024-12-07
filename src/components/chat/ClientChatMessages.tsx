'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { AIModel } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import TextareaAutosize from 'react-textarea-autosize';
import { Send } from 'lucide-react';
import { ImageGenerationMenu } from './ImageGenerationMenu';
import { VoiceMessage } from './VoiceMessage';
import { MessageBubble } from './MessageBubble';
import { Message, MessageMetadata } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';
import Image from 'next/image';

interface ImageMetadata {
  type: 'image';
  imageUrl?: string;
  status: 'generating' | 'completed' | 'failed' | 'error';
  prompt?: string;
  jobId?: string;
}

interface ClientChatMessagesProps {
  chatRoom: ExtendedChatRoom;
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  isGeneratingResponse: boolean;
}

// Memoized message bubble to prevent unnecessary re-renders
const MemoizedMessageBubble = React.memo(MessageBubble);

// Memoized typing indicator
const TypingIndicator = React.memo(({ modelImage }: { modelImage: string | null }) => (
  <div className="flex items-start space-x-2 p-4" data-testid="typing-indicator">
    <div className="w-8 h-8 rounded-full overflow-hidden">
      <Image 
        src={modelImage || '/default-avatar.png'} 
        alt="AI" 
        width={40}
        height={40}
        className="w-full h-full object-cover"
      />
    </div>
    <div className="flex items-center space-x-1 bg-muted/30 px-4 py-2 rounded-lg">
      <span className="w-2 h-2 bg-current rounded-full animate-bounce" />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
      <span className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

// Memoized message input component
const MessageInput = React.memo(({ 
  newMessage, 
  setNewMessage, 
  handleSendMessage, 
  handleKeyDown,
  isLoadingResponse,
  isRecording,
  chatRoom,
  setIsLoadingResponse,
  handleVoiceMessage,
  setIsRecording
}: { 
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoadingResponse: boolean;
  isRecording: boolean;
  chatRoom: ExtendedChatRoom;
  setIsLoadingResponse: (loading: boolean) => void;
  handleVoiceMessage: (audioBlob: Blob) => Promise<void>;
  setIsRecording: (recording: boolean) => void;
}) => (
  <div className="border-t border-gray-800 bg-[#0a0a0a]">
    <form onSubmit={handleSendMessage} className="flex items-end gap-2 p-2">
      <ImageGenerationMenu 
        chatRoom={chatRoom}
        setIsLoadingResponse={setIsLoadingResponse}
        onClose={() => setIsLoadingResponse(false)}
      />
      <VoiceMessage
        onVoiceMessage={handleVoiceMessage}
        isRecording={isRecording}
        setIsRecording={setIsRecording}
      />
      <div className="flex-1 relative">
        <TextareaAutosize
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="w-full bg-[#2a2a2a] text-white rounded-full px-4 py-2 min-h-[40px] max-h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#ff4d8d] text-sm md:text-base"
          disabled={isLoadingResponse || isRecording}
        />
      </div>
      <Button
        type="submit"
        className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white rounded-full p-2 h-10 w-10 flex-shrink-0"
        disabled={!newMessage.trim() || isLoadingResponse || isRecording}
        aria-label="Send message"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  </div>
));

MessageInput.displayName = 'MessageInput';

export default function ClientChatMessages({ 
  chatRoom, 
  onSendMessage, 
  isLoading, 
  isGeneratingResponse 
}: ClientChatMessagesProps) {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout>();

  // All state hooks
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messageError, setMessageError] = useState<string>('');
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  // Memoize message transform function
  const transformMessage = useCallback((message: any): Message => {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message data received');
    }

    // Required fields check
    if (!message.id || !message.chatRoomId) {
      throw new Error('Message missing required fields');
    }

    // Ensure we have a valid metadata object
    const metadata = message.metadata || {};
    
    // Handle image messages with proper status tracking
    if (metadata.type === 'image') {
      metadata.status = metadata.status || 'generating';
      metadata.imageUrl = metadata.imageUrl || null;
      metadata.prompt = metadata.prompt || '';
      metadata.jobId = metadata.jobId || null;
    }

    // Handle voice messages
    if (metadata.type === 'voice_message') {
      metadata.status = metadata.status || 'completed';
    }

    // Handle dates
    const createdAt = message.createdAt ? new Date(message.createdAt) : new Date();
    const updatedAt = message.updatedAt ? new Date(message.updatedAt) : new Date();

    return {
      id: message.id,
      content: message.content || '',
      role: message.isAIMessage ? 'assistant' : 'user',
      metadata: metadata,
      createdAt,
      updatedAt,
      chatRoomId: message.chatRoomId,
      isAIMessage: Boolean(message.isAIMessage),
      userId: message.userId || null,
      user: message.user || null,
      aiModelId: message.aiModelId || null
    };
  }, []);

  // All callbacks
  const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'auto') => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior,
          block: 'end',
        });
      }
    }, 100);
  }, []);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoadingResponse) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsLoadingResponse(true);

    try {
      // Create a temporary message to show immediately
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        role: 'user',
        metadata: { type: 'text' },
        createdAt: new Date(),
        updatedAt: new Date(),
        chatRoomId: chatRoom.id,
        isAIMessage: false,
        userId: null, // Will be set by the server
        user: null,
        aiModelId: null
      };

      // Add the message to the UI immediately
      setMessages(prev => [...prev, tempMessage]);
      
      // Scroll to bottom
      setTimeout(() => scrollToBottom('smooth'), 100);

      // Send the message to the server
      await onSendMessage(messageContent);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageError('Failed to send message');
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
        role: 'alert'
      });
    } finally {
      setIsLoadingResponse(false);
    }
  }, [newMessage, isLoadingResponse, onSendMessage, scrollToBottom, toast, chatRoom.id]);

  const handleVoiceMessage = useCallback(async (audioBlob: Blob) => {
    try {
      setIsLoadingResponse(true);
      
      // Create a temporary voice message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: '[Voice Message]',
        role: 'user',
        metadata: {
          type: 'voice_message',
          status: 'sending'
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        chatRoomId: chatRoom.id,
        isAIMessage: false,
        userId: null,
        user: null,
        aiModelId: null
      };

      // Add the message to the UI immediately
      setMessages(prev => [...prev, tempMessage]);
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        await onSendMessage('[Voice Message]');
        scrollToBottom('smooth');
      };
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Error",
        description: "Failed to send voice message. Please try again.",
        variant: "destructive",
      });
      setMessageError('Failed to send voice message');
    } finally {
      setIsLoadingResponse(false);
    }
  }, [onSendMessage, scrollToBottom, toast, chatRoom.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  // All effects
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${chatRoom.id}/messages`, {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Failed to load messages');
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid message data received');
        }

        const transformedMessages = data.map(transformMessage).sort((a: Message, b: Message) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        setMessages(transformedMessages);
        setIsInitialLoadComplete(true);
        setTimeout(() => scrollToBottom('auto'), 100);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      }
    };
    
    loadMessages();

    let eventSource: EventSource | null = null;
    
    const setupSSE = () => {
      if (!isInitialLoadComplete) return;
      
      eventSource = new EventSource(`/api/chat/${chatRoom.id}/subscribe`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.connected) {
            console.log('SSE Connected');
            return;
          }

          if (data.message) {
            const transformedMessage = transformMessage(data.message);
            setMessages(prevMessages => {
              // Find existing message (temp or real)
              const existingIndex = prevMessages.findIndex(msg => 
                msg.id === transformedMessage.id || 
                (msg.id.startsWith('temp-') && msg.content === transformedMessage.content)
              );

              let newMessages;
              if (existingIndex !== -1) {
                // Update existing message
                newMessages = [...prevMessages];
                // Merge metadata to preserve any local state
                newMessages[existingIndex] = {
                  ...transformedMessage,
                  metadata: {
                    ...prevMessages[existingIndex].metadata,
                    ...transformedMessage.metadata
                  }
                };
              } else {
                // Add new message
                newMessages = [...prevMessages, transformedMessage];
              }
              
              // Sort by creation date
              return newMessages.sort((a, b) => 
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            });
            
            setTimeout(() => scrollToBottom('smooth'), 100);
          }
        } catch (error) {
          console.error('Error handling SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        setTimeout(() => {
          if (eventSource) {
            eventSource.close();
            setupSSE();
          }
        }, 5000);
      };
    };

    setupSSE();

    return () => {
      if (eventSource) {
        console.log('Closing SSE connection');
        eventSource.close();
      }
    };
  }, [mounted, chatRoom.id, isInitialLoadComplete, scrollToBottom, toast, transformMessage]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-pretty p-4 space-y-4">
        {messages.map((message) => (
          <MemoizedMessageBubble
            key={message.id}
            message={message}
            modelImage={chatRoom.aiModel?.imageUrl || null}
            isRead={message.isAIMessage ? true : message.metadata?.isRead || false}
          />
        ))}
        {(isLoadingResponse || isGeneratingResponse) && (
          <TypingIndicator modelImage={chatRoom.aiModel?.imageUrl || null} />
        )}
        {messageError && (
          <div role="alert" className="text-red-500">{messageError}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        handleKeyDown={handleKeyDown}
        isLoadingResponse={isLoadingResponse}
        isRecording={isRecording}
        chatRoom={chatRoom}
        setIsLoadingResponse={setIsLoadingResponse}
        handleVoiceMessage={handleVoiceMessage}
        setIsRecording={setIsRecording}
      />
    </div>
  );
}
