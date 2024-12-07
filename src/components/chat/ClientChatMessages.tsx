'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AIModel, User } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import TextareaAutosize from 'react-textarea-autosize';
import { Send } from 'lucide-react';
import { ImageGenerationMenu } from './ImageGenerationMenu';
import { VoiceMessage } from './VoiceMessage';
import {
  sendMessage,
  getChatRoomMessages,
  generateImage,
  subscribeToMessages,
} from '@/lib/actions/chat';
import { MessageBubble } from './MessageBubble';
import { debounce } from 'lodash';
import Image from 'next/image';
import { Message, MessageMetadata } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';

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

// Typing Indicator Component
const TypingIndicator = ({ modelImage }: { modelImage: string | null }) => (
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
);

const transformPrismaMessage = (message: any): Message => {
  // Ensure we have a valid metadata object
  const metadata = message.metadata || {};
  
  // Handle image messages
  if (metadata.type === 'image') {
    metadata.status = metadata.status || 'completed';
    metadata.imageUrl = metadata.imageUrl || null;
    metadata.prompt = metadata.prompt || '';
  }

  return {
    id: message.id,
    content: message.content,
    role: message.isAIMessage ? 'assistant' : 'user',
    metadata: metadata,
    createdAt: new Date(message.createdAt),
    updatedAt: new Date(message.updatedAt),
    chatRoomId: message.chatRoomId,
    isAIMessage: message.isAIMessage,
    userId: message.userId || null,
    user: message.user || null,
    aiModelId: message.aiModelId || null
  };
};

export default function ClientChatMessages({ 
  chatRoom, 
  onSendMessage, 
  isLoading, 
  isGeneratingResponse 
}: ClientChatMessagesProps) {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const messageQueue = useRef<string[]>([]);

  // All state hooks
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState<number>(0);
  const [messageError, setMessageError] = useState<string>('');

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
      if (typeof onSendMessage !== 'function') {
        throw new Error('onSendMessage is not a function');
      }
      await onSendMessage(messageContent);
      scrollToBottom();
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
  }, [newMessage, isLoadingResponse, onSendMessage, scrollToBottom, toast]);

  const handleVoiceMessage = useCallback(async (audioBlob: Blob) => {
    try {
      setIsLoadingResponse(true);
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        await sendMessage(chatRoom.id, '[Voice Message]', {
          type: 'voice_message',
          audioData: base64Audio
        });
        
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
  }, [chatRoom.id, scrollToBottom, toast]);

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
        const transformedMessages = data.map(transformPrismaMessage).sort((a: Message, b: Message) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        });
        setMessages(transformedMessages);
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

    // Set up SSE subscription
    const eventSource = new EventSource(`/api/chat/${chatRoom.id}/subscribe`);
    
    eventSource.onmessage = (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        if (!newMessage.id) return;

        setMessages((prevMessages) => {
          const transformedNewMessage = transformPrismaMessage(newMessage);
          const existingIndex = prevMessages.findIndex(msg => msg.id === transformedNewMessage.id);
          
          // Check if this is a new image generation message or an update
          const isImageMessage = transformedNewMessage.metadata?.type === 'image';
          const isNewMessage = existingIndex === -1;
          const shouldScroll = isNewMessage || 
                             (isImageMessage && transformedNewMessage.metadata?.status === 'completed');
          
          let updatedMessages;
          if (existingIndex !== -1) {
            updatedMessages = [...prevMessages];
            updatedMessages[existingIndex] = {
              ...transformedNewMessage,
              metadata: {
                ...prevMessages[existingIndex].metadata,
                ...transformedNewMessage.metadata
              }
            };
          } else {
            updatedMessages = [...prevMessages, transformedNewMessage].sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
          
          if (shouldScroll) {
            setTimeout(() => scrollToBottom('smooth'), 100);
          }
          
          return updatedMessages;
        });
      } catch (error) {
        console.error('Error handling message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      setTimeout(() => {
        loadMessages();
      }, 3000);
    };

    return () => {
      eventSource.close();
    };
  }, [chatRoom.id, mounted, scrollToBottom, toast]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-pretty p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            modelImage={chatRoom.aiModel?.imageUrl || null}
            isRead={message.isAIMessage ? true : message.metadata?.isRead || false}
          />
        ))}
        {(isLoadingResponse || isGeneratingResponse) && <TypingIndicator modelImage={chatRoom.aiModel?.imageUrl || null} />}
        {messageError && <div role="alert" className="text-red-500">{messageError}</div>}
        <div ref={messagesEndRef} />
      </div>

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
            />
          </div>
          <Button
            type="submit"
            className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white rounded-full p-2 h-10 w-10 flex-shrink-0"
            disabled={isLoading || isLoadingResponse || isRecording}
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
