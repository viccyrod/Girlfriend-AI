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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState<number>(0);
  const [messageError, setMessageError] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const messageQueue = useRef<string[]>([]);
  const { toast } = useToast();

  // Scroll to bottom helper function
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

  // Load initial messages
  useEffect(() => {
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
        // Ensure initial scroll to bottom after messages load
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
  }, [chatRoom.id, toast, scrollToBottom]);

  // Subscribe to new messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatRoom.id, (newMessage) => {
      setMessages((prevMessages) => {
        // Transform the new message
        const transformedNewMessage = transformPrismaMessage(newMessage);
        
        // Check if message already exists
        const existingMessageIndex = prevMessages.findIndex(msg => msg.id === transformedNewMessage.id);
        
        if (existingMessageIndex !== -1) {
          // Update existing message
          const updatedMessages = [...prevMessages];
          updatedMessages[existingMessageIndex] = transformedNewMessage;
          return updatedMessages;
        }
        
        // Add new message
        return [...prevMessages, transformedNewMessage].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      
      // Scroll to bottom with new message
      setTimeout(() => scrollToBottom('smooth'), 100);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [chatRoom.id, scrollToBottom]);

  // Debounce message sending
  const debouncedSendMessage = useCallback(
    debounce(async (content: string) => {
      try {
        setIsLoadingResponse(true);
        const response = await sendMessage(chatRoom.id, content);
        
        if (response?.error?.includes('rate limit')) {
          setIsRateLimited(true);
          const waitTime = parseInt(response.error.match(/\d+/)?.[0] || '60');
          setRateLimitTimer(waitTime);
          
          toast({
            title: 'Taking a short break',
            description: `The AI needs a moment to process. Please wait ${waitTime} seconds.`,
            duration: 5000,
          });
          
          // Start countdown
          const interval = setInterval(() => {
            setRateLimitTimer((prev) => {
              if (prev <= 1) {
                clearInterval(interval);
                setIsRateLimited(false);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return;
        }

        // Process message queue
        if (messageQueue.current.length > 0) {
          const nextMessage = messageQueue.current.shift();
          if (nextMessage) {
            debouncedSendMessage(nextMessage);
          }
        }
        
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive',
          role: 'alert'
        });
        // Add visible error message in DOM
        setMessageError('Failed to send message');
      } finally {
        setIsLoadingResponse(false);
      }
    }, 1000),
    [chatRoom.id, toast]
  );

  const handleSendMessage = async (e: React.FormEvent) => {
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
  };

  // Add cleanup
  useEffect(() => {
    return () => {
      debouncedSendMessage.cancel();
    };
  }, [debouncedSendMessage]);

  const handleVoiceMessage = async (audioBlob: Blob) => {
    try {
      setIsLoadingResponse(true);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        // Send voice message
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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Message Display */}
      <div 
        className="flex-1 overflow-y-auto scrollbar-pretty p-4 space-y-4"
      >
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
        <div ref={messagesEndRef} /> {/* Scroll anchor */}
      </div>

      {/* Message Input */}
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
