'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AIModel, User } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import TextareaAutosize from 'react-textarea-autosize';
import { Send } from 'lucide-react';
import ImageGenerationMenu from './ImageGenerationMenu';
import { VoiceMessage } from './VoiceMessage';
import { 
  sendMessage, 
  generateImage, 
  subscribeToMessages,
  getChatRoomMessages
} from '@/lib/actions/chat';
import { MessageBubble } from './MessageBubble';
import { debounce } from 'lodash';

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
  role: string;
  metadata: {
    type?: string;
    imageData?: string;
    prompt?: string;
    isRead?: boolean;
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
  _onSendMessage: (content: string) => Promise<void>;
  _isLoading: boolean;
}

// Typing Indicator Component
const TypingIndicator = ({ modelImage }: { modelImage: string | null }) => (
  <div className="flex items-start space-x-2 p-4">
    <div className="w-8 h-8 rounded-full overflow-hidden">
      <img 
        src={modelImage || '/default-avatar.png'} 
        alt="AI" 
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

export default function ClientChatMessages({ chatRoom, _onSendMessage, _isLoading }: ClientChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const messageQueue = useRef<string[]>([]);
  const { toast } = useToast();

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
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
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

    if (isRateLimited) {
      messageQueue.current.push(messageContent);
      toast({
        title: 'Message queued',
        description: `Your message will be sent in ${rateLimitTimer} seconds.`,
        duration: 3000,
      });
      return;
    }

    await debouncedSendMessage(messageContent);
  };

  // Add cleanup
  useEffect(() => {
    return () => {
      debouncedSendMessage.cancel();
    };
  }, [debouncedSendMessage]);

  // Scroll to bottom helper function
  const scrollToBottom = useCallback((behavior: 'auto' | 'smooth' = 'auto') => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      const chatContainer = messagesEndRef.current?.parentElement;
      if (chatContainer) {
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: behavior
        });
      }
    }, 100);
  }, []);

  // Add this effect to load initial messages
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialMessages = async () => {
      try {
        // Load messages immediately
        const initialMessages = await getChatRoomMessages(chatRoom.id);
        if (isMounted) {
          setMessages(initialMessages as Message[]);
          scrollToBottom();
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive",
        });
      }
    };

    // Load messages right away
    loadInitialMessages();

    // Set up SSE subscription in parallel
    const unsubscribe = subscribeToMessages(chatRoom.id, (newMessage) => {
      if (!isMounted) return;
      
      setMessages(prev => {
        // Don't add duplicates
        if (prev.some(msg => msg.id === newMessage.id)) {
          return prev;
        }
        
        const typedMessage: Message = {
          ...newMessage,
          metadata: newMessage.metadata as Message['metadata']
        };
        
        return [...prev, typedMessage].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
      scrollToBottom('smooth');
    });

    return () => {
      isMounted = false;
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      unsubscribe();
    };
  }, [chatRoom.id, scrollToBottom, toast]);

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

  useEffect(() => {
    // Scroll on new messages
    scrollToBottom('smooth');
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Scroll on initial load
    scrollToBottom('auto');
  }, [scrollToBottom]);

  return (
    <div className="flex flex-col h-full">
      {/* Message Display */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            modelImage={chatRoom.aiModel?.imageUrl || null}
            isRead={message.isAIMessage ? true : message.metadata?.isRead || false}
          />
        ))}
        {isLoadingResponse && <TypingIndicator modelImage={chatRoom.aiModel?.imageUrl || null} />}
        <div ref={messagesEndRef} /> {/* Scroll anchor */}
      </div>

      {/* Message Input */}
      <div className="p-2 md:p-4 border-t border-gray-800 bg-[#0a0a0a]">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <ImageGenerationMenu 
            onSelect={async (prompt: string) => {
              try {
                setIsLoadingResponse(true);
                const response = await generateImage(prompt, chatRoom.id);
                setMessages(prev => [...prev, response.message]);
                scrollToBottom('smooth');
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
          <VoiceMessage
            onVoiceMessage={handleVoiceMessage}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
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
            disabled={isLoadingResponse || isRecording}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}