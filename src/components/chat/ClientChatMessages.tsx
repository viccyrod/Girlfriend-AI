'use client'; 
// This indicates the file is a client-side component in Next.js, meaning it can use hooks like useState and useEffect.

import React, { useState, useEffect, useRef, useCallback } from 'react';
// Importing necessary React hooks. useState manages local state, useEffect handles side effects, 
// useRef creates a persistent reference, and useCallback memoizes a function to prevent unnecessary re-creations.

import { getChatRoomMessages, sendMessage, deleteMessage } from '@/app/api/chat/client-actions';
// Importing API functions to fetch chat messages, send new messages, and delete existing messages.

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// UI components for displaying user avatars (images or fallback if unavailable).

import { Button } from '@/components/ui/button';
// A styled button component.

import { Input } from '@/components/ui/input';
// A styled input component for user interaction.

import { ToastProvider, Toast } from '@/components/ui/toast';
// Components for displaying toasts (user notifications).

import { ChatRoom, User } from '@prisma/client';
// ChatRoom type definition, assuming Prisma is being used for database management.

import { useToast } from '@/hooks/use-toast';
// A custom hook to trigger toasts for success or error messages.

import { Message } from '@/types/chat'; 
// Ensures that the Message type is defined and imported for type safety.

import { TrashIcon } from '@radix-ui/react-icons';
// Icon for deleting messages.

import { useCurrentUser } from '@/hooks/useCurrentUser';

import { useVirtualizer } from '@tanstack/react-virtual';
import { format } from 'date-fns';
import TextareaAutosize from 'react-textarea-autosize';

interface ClientChatMessagesProps {
  chatRoom: ChatRoom;
  aiModel?: any;
}
// TypeScript interface to define the expected props for this component, specifically a chatRoom object.

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
  </div>
);

export default function ClientChatMessages({ chatRoom, aiModel }: ClientChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const currentUser = useCurrentUser();

  const fetchMessages = useCallback(async () => {
    try {
      const fetchedMessages = await getChatRoomMessages(chatRoom.id);
      const messagesWithUser = fetchedMessages.map(msg => ({
        ...msg,
        user: { id: msg.userId, name: 'Unknown', image: null } as User
      }));
      setMessages(messagesWithUser as Message[]);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive",
      });
    }
  }, [chatRoom.id, toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/chat/${chatRoom.id}/sse`);
    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };
    return () => eventSource.close();
  }, [chatRoom.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      userId: currentUser?.id || '',
      chatRoomId: chatRoom.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setIsSending(true);

    try {
      const sentMessages = await sendMessage(userMessage.content, chatRoom.id, chatRoom.users.find(user => user.isAI)?.id || null);
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== userMessage.id),
        ...(Array.isArray(sentMessages) ? sentMessages : [sentMessages])
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh)]">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
        <div ref={messagesEndRef} />
        {isSending && (
          <div className="flex justify-start mb-4">
            <TypingIndicator />
          </div>
        )}
        {messages.slice().reverse().map((message, index) => {
          const isCurrentUser = message.userId === currentUser?.id;
          const messageUser = isCurrentUser ? currentUser : chatRoom.users.find(user => user.id === message.userId);

          return (
            <div key={message.id} className="message-container flex items-end mb-4">
              <div className={`flex ${isCurrentUser ? 'justify-end ml-auto' : 'justify-start'} items-end group max-w-[70%]`}>
                {!isCurrentUser && (
                  <div className="avatar-container min-w-[32px] min-h-[32px] mr-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage className="object-cover" src={messageUser?.image || ''} alt={messageUser?.name || 'User'} />
                      <AvatarFallback>{messageUser?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  </div>
                )}
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-2 ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70 text-right">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 group-hover:opacity-100 opacity-0 transition-opacity duration-200">
                    {messageUser?.name || 'Unknown User'}
                  </p>
                </div>
                {isCurrentUser && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMessage(message.id)}
                    aria-label={`Delete message from ${messageUser?.name || 'Unknown User'}`}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex items-center">
          <TextareaAutosize
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 mr-2 resize-none rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            minRows={1}
          />
          <Button type="submit" disabled={isSending}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
