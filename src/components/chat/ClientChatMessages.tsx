'use client';

import React, { useReducer, useCallback, useMemo } from 'react';
import { Message } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';
import { isSameDay } from 'date-fns';
import { ChatInfoBar } from './ChatInfoBar';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { cn } from '@/lib/utils';

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
  const [state, dispatch] = useReducer(messageStateReducer, {
    newMessage: '',
    isLoading: false
  });

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

  // Handle message sending and streaming
  const handleSendMessage = async (content: string) => {
    if (!selectedRoom?.id) return;

    const userMessage: Message = {
      id: Date.now().toString(),
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

    const response = await fetch(`/api/chat/${selectedRoom.id}/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    if (!response.ok) throw new Error('Failed to send message');
    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const aiMessage: Message = {
      id: Date.now().toString() + '-ai',
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

    try {
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
    } finally {
      reader.cancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

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
      "h-[calc(100vh-6rem)]",
      "md:h-[calc(100vh-3rem)]",
      "bg-[#0a0a0a]"
    )}>
      {/* Chat Info Bar */}
      <div className="shrink-0 border-b border-white/5">
        <ChatInfoBar
          modelImage={model?.imageUrl || selectedRoom?.aiModel?.imageUrl}
          modelName={model?.name || selectedRoom?.aiModel?.name || 'AI Assistant'}
          modelPersonality={model?.personality || selectedRoom?.aiModel?.personality || 'Online'}
        />
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-hidden">
        <ChatMessageList
          messageGroups={messageGroups}
          isLoading={state.isLoading}
          error={state.error}
          onDismissError={() => dispatch({ type: 'CLEAR_ERROR' })}
          modelImage={model?.imageUrl || selectedRoom?.aiModel?.imageUrl}
        />
      </div>

      {/* Chat Input */}
      <div className="shrink-0 bg-[#0a0a0a] border-t border-white/5">
        <ChatInput
          value={state.newMessage}
          onChange={(e) => dispatch({ type: 'SET_NEW_MESSAGE', payload: e.target.value })}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          isLoading={state.isLoading}
          maxLength={4000}
        />
      </div>
    </div>
  );
}
