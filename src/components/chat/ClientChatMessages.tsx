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
  metadata?: {
    type?: string;
    imageData?: string;
    prompt?: string;
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
  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
    {Array.from({ length: 3 }).map((_, idx) => (
      <div
        key={idx}
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${idx * 200}ms` }}
      />
    ))}
  </div>
);

// MessageBubble Component for rendering each message
const MessageBubble = ({ message }: { message: Message }) => {
  const isAIMessage = message.isAIMessage;
  const hasImage = message.metadata?.type === 'image';
  const imageData = message.metadata?.imageData;

  return (
    <div className={`flex ${isAIMessage ? 'justify-start' : 'justify-end'} mb-4 group`}>
      <div className={`flex ${isAIMessage ? 'flex-row' : 'flex-row-reverse'} items-end max-w-[80%]`}>
        <Avatar className={`flex-shrink-0 ${isAIMessage ? 'mr-2' : 'ml-2'}`}>
          <AvatarImage src={message.user?.image || '/ai-models/default-avatar.png'} alt="Avatar" />
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col ${isAIMessage ? 'items-start' : 'items-end'}`}>
          <div className={`rounded-lg px-4 py-2 ${
            isAIMessage 
              ? 'bg-secondary text-secondary-foreground' 
              : 'bg-primary text-primary-foreground'
          }`}>
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            
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
              {format(new Date(message.createdAt), 'HH:mm')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Functions
const shouldGenerateImage = (message: string) => {
  const triggerWords = ['send me', 'generate', 'create image', 'show me'];
  return triggerWords.some(trigger => message.toLowerCase().includes(trigger));
};

const generateImage = async (prompt: string, chatRoomId: string) => {
  const response = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, chatRoomId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate image');
  }
  
  return response.json();
};

// Main Component
export default function ClientChatMessages({ chatRoom, onSendMessage, _isLoading }: ClientChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const { toast } = useToast();

  // Scroll to bottom utility
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Initialize messages and SSE connection
  useEffect(() => {
    let isMounted = true;

    async function initializeChat() {
      try {
        // Fetch initial messages
        const response = await fetch(`/api/chat/${chatRoom.id}/messages`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const initialMessages = await response.json();
        
        if (isMounted) {
          setMessages(initialMessages);
          scrollToBottom();
        }

        // Setup SSE connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        const eventSource = new EventSource(`/api/chat/${chatRoom.id}/sse`);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          if (!isMounted) return;
          
          try {
            const newMessage = JSON.parse(event.data);
            if (newMessage && newMessage.id) {
              setMessages(prev => {
                if (prev.some(msg => msg.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });
              scrollToBottom();
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE Error:', error);
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
        };

        // Handle connection event
        eventSource.addEventListener('connected', (event) => {
          console.log('SSE Connected:', event.data);
        });

        // Handle heartbeat
        eventSource.addEventListener('heartbeat', () => {
          console.log('SSE Heartbeat received');
        });
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Error",
          description: "Failed to initialize chat. Please refresh the page.",
          variant: "destructive",
        });
      }
    }

    initializeChat();

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [chatRoom.id, toast]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoadingResponse) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      setIsLoadingResponse(true);

      if (shouldGenerateImage(messageContent)) {
        const prompt = messageContent.replace(/^(send me|generate|create image|show me)/i, '').trim();
        const response = await generateImage(prompt, chatRoom.id);
        setMessages(prev => [...prev, response.message]);
      } else {
        await onSendMessage(messageContent);
      }

      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // Restore the message in case of error
      setNewMessage(messageContent);
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
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoadingResponse && <TypingIndicator />}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-800 bg-[#0a0a0a]">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
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
            className="flex-1 bg-[#2a2a2a] text-white rounded-full px-4 py-2 min-h-[40px] max-h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#ff4d8d]"
          />
          <Button
            type="submit"
            className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white rounded-full p-2 h-10 w-10"
            disabled={isLoadingResponse}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}