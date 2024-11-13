'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AIModel, User } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { format } from 'date-fns';
import TextareaAutosize from 'react-textarea-autosize';
import { Send } from 'lucide-react';
import ImageGenerationMenu from './ImageGenerationMenu';
import { 
  sendMessage, 
  generateImage, 
  subscribeToMessages,
  getChatRoomMessages
} from '@/lib/actions/chat';


// Message and ChatRoom Interfaces
interface Message {
  id: string;
  content: string;
  userId: string | null;
  chatRoomId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  aiModelId: string | null;
  isAIMessage: boolean;
  metadata: {
    type?: string;
    imageData?: string;
    prompt?: string;
    [key: string]: unknown;
  };
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

interface ClientChatMessagesProps {
  chatRoom: {
    id: string;
    users: User[];
    aiModel: AIModel | null;
  };
  onSendMessage: (content: string) => Promise<void>;
  _isLoading: boolean;
}

// Typing Indicator Component
const TypingIndicator = () => (
  <div className="flex items-start gap-3 animate-fade-in">
    <Avatar className="w-8 h-8">
      <AvatarImage src="/default-avatar.png" alt="AI" />
      <AvatarFallback>AI</AvatarFallback>
    </Avatar>
    <div className="bg-secondary rounded-lg px-4 py-2 max-w-[75%]">
      <div className="flex gap-1 items-center h-6">
        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
      </div>
    </div>
  </div>
);

// MessageBubble Component for rendering each message
const MessageBubble = ({ message }: { message: Message }) => {
  const isAIMessage = message.isAIMessage;
  const hasImage = message.metadata?.type === 'image';
  const imageData = message.metadata?.imageData;

  // Add date parsing helper
  const formatMessageDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' 
        ? new Date(dateString.replace('Z', '')) // Handle ISO strings
        : dateString;
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return '--:--'; // Fallback time format
    }
  };

  return (
    <div className={`flex ${isAIMessage ? 'justify-start' : 'justify-end'} mb-2 md:mb-4 group px-2 md:px-0`}>
      <div className={`flex ${isAIMessage ? 'flex-row' : 'flex-row-reverse'} items-end max-w-[85%] md:max-w-[75%]`}>
        <Avatar className={`hidden md:flex flex-shrink-0 ${isAIMessage ? 'mr-2' : 'ml-2'}`}>
          <AvatarImage src={message.user?.image || '/ai-models/default-avatar.png'} alt="Avatar" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col ${isAIMessage ? 'items-start' : 'items-end'}`}>
          <div className={`rounded-lg px-3 py-2 md:px-4 md:py-2 ${
            isAIMessage 
              ? 'bg-secondary text-secondary-foreground' 
              : 'bg-primary text-primary-foreground'
          }`}>
            <p className="text-sm md:text-base whitespace-pre-wrap break-words">{message.content}</p>
            
            {hasImage && imageData && (
              <div className="mt-2 relative w-[512px] h-[512px]">
                <Image
                  src={`data:image/jpeg;base64,${imageData}`}
                  alt={message.content}
                  fill
                  className="rounded-lg object-contain"
                  sizes="(max-width: 768px) 100vw, 512px"
                />
              </div>
            )}
            
            <p className="text-xs mt-1 opacity-70 text-right">
              {formatMessageDate(message.createdAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
interface Message {
  id: string;
  content: string;
  userId: string | null;
  chatRoomId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  aiModelId: string | null;
  isAIMessage: boolean;
  metadata: {
    type?: string;
    imageData?: string;
    prompt?: string;
    [key: string]: unknown;
  };
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}

// Update the props interface to mark onSendMessage as optional with underscore
interface ClientChatMessagesProps {
  chatRoom: {
    id: string;
    users: User[];
    aiModel: AIModel | null;
  };
  _onSendMessage?: (content: string) => Promise<void>;
  _isLoading: boolean;
}

export default function ClientChatMessages({ chatRoom, _onSendMessage, _isLoading }: ClientChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Scroll to bottom utility
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Add this effect to load initial messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        const initialMessages = await getChatRoomMessages(chatRoom.id);
        setMessages(initialMessages as Message[]);
        scrollToBottom();
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
      }
    };

    loadInitialMessages();
  }, [chatRoom.id]);

  // Add this effect instead
  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatRoom.id, (newMessage) => {
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        
        // Cast the metadata to match the Message interface
        const typedMessage: Message = {
          ...newMessage,
          metadata: newMessage.metadata as Message['metadata']
        };
        
        return [...prev, typedMessage].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      scrollToBottom();
    });

    return () => {
      unsubscribe();
    };
  }, [chatRoom.id, scrollToBottom]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoadingResponse) return;

    try {
      setIsLoadingResponse(true);
      
      // Send the user message
      await sendMessage(chatRoom.id, newMessage);
      
      // Clear the input
      setNewMessage('');

      // The AI response will come through the SSE connection
      // No need to manually add it here
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoadingResponse && <TypingIndicator />}
      </div>

      {/* Message Input */}
      <div className="p-2 md:p-4 border-t border-gray-800 bg-[#0a0a0a]">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <ImageGenerationMenu 
            onSelect={async (prompt) => {
              try {
                setIsLoadingResponse(true);
                const response = await generateImage(prompt, chatRoom.id);
                setMessages(prev => [...prev, response.message]);
                scrollToBottom();
              } catch (error) {
                toast({
                  title: "Error",
                  description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
                  variant: "destructive",
                });
              } finally {
                setIsLoadingResponse(false);
              }
            }} 
          />
          <TextareaAutosize
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-[#2a2a2a] text-white rounded-full px-4 py-2 min-h-[40px] max-h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#ff4d8d] text-sm md:text-base"
          />
          <Button
            type="submit"
            className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white rounded-full p-2 h-10 w-10 flex-shrink-0"
            disabled={isLoadingResponse}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}