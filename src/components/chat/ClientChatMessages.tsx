'use client';

import React, { useReducer, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Message } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';
import { isSameDay } from 'date-fns';
import { ChatInfoBar } from './ChatInfoBar';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';
import { generateImage } from '@/lib/chat-client';

// Message state interface and reducer
interface MessageState {
  newMessage: string;
  isLoading: boolean;
  error?: string;
}

type MessageAction = 
  | { type: 'SET_NEW_MESSAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

function messageStateReducer(state: MessageState, action: MessageAction): MessageState {
  switch (action.type) {
    case 'SET_NEW_MESSAGE':
      return { ...state, newMessage: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: undefined };
    default:
      return state;
  }
}

// Group messages by date
function groupMessagesByDate(messages: Message[]) {
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const groups: { messages: Message[]; date: Date }[] = [];
  let currentGroup: Message[] = [];
  let currentDate: Date | null = null;

  sortedMessages.forEach((message) => {
    const messageDate = new Date(message.createdAt);
    
    if (!currentDate || !isSameDay(messageDate, currentDate)) {
      if (currentGroup.length > 0) {
        groups.push({ messages: currentGroup, date: currentDate! });
      }
      currentGroup = [message];
      currentDate = messageDate;
    } else {
      currentGroup.push(message);
    }
  });

  if (currentGroup.length > 0 && currentDate) {
    groups.push({ messages: currentGroup, date: currentDate });
  }

  return groups;
}

interface ClientChatMessagesProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  selectedRoom: ExtendedChatRoom | null;
  model?: ExtendedChatRoom['aiModel'];
}

export function ClientChatMessages({ 
  messages, 
  setMessages, 
  selectedRoom,
  model 
}: ClientChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [state, dispatch] = useReducer(messageStateReducer, {
    newMessage: '',
    isLoading: false
  });
  const [sseConnected, setSseConnected] = useState(false);

  // Memoize message groups
  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages]);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.isLoading || !state.newMessage.trim()) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await handleSendMessage(state.newMessage.trim());
      dispatch({ type: 'SET_NEW_MESSAGE', payload: '' });
    } catch (error) {
      if (error instanceof Error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Handle image generation
  const handleGenerateImage = async (prompt: string) => {
    if (!selectedRoom) return;
    
    console.log('🎨 Starting image generation...');
    setIsGenerating(true);

    try {
      // Create a temporary message
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content: prompt,
        chatRoomId: selectedRoom.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIMessage: true,
        metadata: { 
          type: 'image',
          status: 'generating',
          prompt: prompt
        },
        userId: null,
        aiModelId: selectedRoom.aiModelId,
        role: 'assistant',
        user: null
      };

      // Add temporary message immediately
      setMessages(prev => [...prev, tempMessage]);

      // Start image generation in background
      generateImage(prompt, selectedRoom.id).catch(error => {
        console.error('❌ Failed to generate image:', error);
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id
            ? { ...msg, metadata: { ...msg.metadata, status: 'error' } }
            : msg
        ));
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle text message sending
  const handleSendMessage = async (content: string) => {
    if (!selectedRoom?.id || !content.trim()) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Add user message immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        content,
        chatRoomId: selectedRoom.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIMessage: false,
        metadata: { type: 'text' },
        userId: null,
        aiModelId: selectedRoom.aiModelId,
        role: 'user',
        user: null
      };
      setMessages(prev => [...prev, userMessage]);

      // Start streaming AI response
      const response = await fetch(`/api/chat/${selectedRoom.id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (!response.ok) throw new Error('Failed to send message');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // Add initial AI message
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: '',
        chatRoomId: selectedRoom.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIMessage: true,
        metadata: { type: 'text' },
        userId: null,
        aiModelId: selectedRoom.aiModelId,
        role: 'assistant',
        user: null
      };
      setMessages(prev => [...prev, aiMessage]);

      // Stream the response
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
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: msg.content + data.content }
                : msg
            ));
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Listen for SSE updates
  useEffect(() => {
    if (!selectedRoom?.id) return;

    console.log('🔌 Setting up SSE connection...');
    const eventSource = new EventSource(`/api/chat/${selectedRoom.id}/stream`);

    eventSource.onopen = () => {
      console.log('📡 SSE connection opened');
      setSseConnected(true);
    };

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received SSE message:', data);
        
        if (data.type === 'image_generation') {
          console.log('🖼️ Processing image update:', {
            messageId: data.message.id,
            metadata: data.message.metadata,
            imageUrl: data.message.metadata?.imageUrl
          });
          
          setMessages(prev => {
            // Find any temporary or generating message to replace
            const index = prev.findIndex(m => 
              (m.metadata?.type === 'image' && !m.metadata.imageUrl) ||
              m.id.startsWith('temp-') ||
              m.id === data.message.id
            );
            
            if (index !== -1) {
              const newMessages = [...prev];
              // Replace the message directly
              newMessages[index] = {
                ...data.message,
                metadata: {
                  ...data.message.metadata,
                  type: 'image',
                  status: data.message.metadata?.imageUrl ? 'completed' : 'generating'
                }
              };
              console.log('📝 Updated message at index', index, {
                id: newMessages[index].id,
                metadata: newMessages[index].metadata,
                hasImage: !!newMessages[index].metadata?.imageUrl
              });
              return newMessages;
            }
            
            console.log('➕ Adding new message:', {
              id: data.message.id,
              metadata: data.message.metadata,
              hasImage: !!data.message.metadata?.imageUrl
            });
            return [...prev, data.message];
          });
        }
      } catch (error) {
        console.error('❌ Error processing SSE message:', error);
      }
    });

    eventSource.addEventListener('error', (error) => {
      console.error('❌ SSE connection error:', error);
      setSseConnected(false);
      // Try to reconnect after a delay
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect SSE...');
        eventSource.close();
        const newEventSource = new EventSource(`/api/chat/${selectedRoom.id}/stream`);
        eventSource.onopen = () => setSseConnected(true);
      }, 1000);
    });

    return () => {
      console.log('🔌 Closing SSE connection');
      setSseConnected(false);
      eventSource.close();
    };
  }, [selectedRoom?.id]);

  if (!selectedRoom) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <p className="text-white/50">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col",
      "h-[calc(100vh-4rem)]",
      "bg-[#0a0a0a]",
      "relative"
    )}>
      {/* Chat Info Bar */}
      <div className="shrink-0 bg-[#0a0a0a] border-b border-white/5">
        <ChatInfoBar
          modelImage={model?.imageUrl || selectedRoom?.aiModel?.imageUrl}
          modelName={model?.name || selectedRoom?.aiModel?.name || 'AI Assistant'}
          modelPersonality={model?.personality || selectedRoom?.aiModel?.personality || 'Online'}
          modelId={selectedRoom?.aiModelId || ''}
        />
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto">
        <ChatMessageList
          messages={messages}
          modelImage={selectedRoom?.aiModel?.imageUrl}
        />
      </div>

      {/* Chat Input */}
      <div className={cn(
        "shrink-0",
        "bg-[#0a0a0a]",
        "border-t border-white/5",
        "px-2 md:px-4 py-2"
      )}>
        <ChatInput
          value={state.newMessage}
          onChange={(e) => dispatch({ type: 'SET_NEW_MESSAGE', payload: e.target.value })}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          onGenerateImage={handleGenerateImage}
          isLoading={state.isLoading}
          maxLength={4000}
        />
      </div>
    </div>
  );
}
