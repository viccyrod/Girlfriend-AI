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

interface ClientChatMessagesProps {
  chatRoom: ChatRoom;
  aiModel?: any;
}
// TypeScript interface to define the expected props for this component, specifically a chatRoom object.

export default function ClientChatMessages({ chatRoom, aiModel }: ClientChatMessagesProps) {
    // The main functional component that takes in a chatRoom prop.
  
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const parentRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const currentUser = useCurrentUser();
  
    const rowVirtualizer = useVirtualizer({
      count: messages.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 50,
      overscan: 5,
    });
  
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
  
    useEffect(() => {
      rowVirtualizer.scrollToIndex(messages.length - 1);
    }, [messages, rowVirtualizer]);
  
    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;
      
        setIsSending(true);
        try {
          const sentMessages = await sendMessage(newMessage, chatRoom.id, chatRoom.users.find(user => user.isAI)?.id || null);
          setMessages(prevMessages => [...prevMessages, ...(Array.isArray(sentMessages) ? sentMessages : [sentMessages])]);
          setNewMessage('');
        } catch (error) {
          console.error('Failed to send message:', error);
          toast({
            title: "Error",
            description: "Failed to send message. Please try again.",
            variant: "destructive",
          });
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
  
    return (
        <div className="flex flex-col h-screen">
        {/* Main container that takes the full height of the screen */}
        
        <div ref={parentRef} className="flex-1 overflow-y-auto p-4">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const message = messages[virtualRow.index];
              const isCurrentUser = message.userId === currentUser?.id;
              const messageUser = isCurrentUser ? currentUser : chatRoom.users.find(user => user.id === message.userId);

              return (
                <div
                  key={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className={`flex items-start space-x-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    {!isCurrentUser && (
                      <Avatar>
                        <AvatarImage src={messageUser?.image || ''} alt={messageUser?.name || 'User'} />
                        <AvatarFallback>{messageUser?.name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs ${isCurrentUser ? 'bg-blue-500 text-white' : 'bg-gray-200'} rounded-lg p-3`}>
                      <p className="font-medium">{messageUser?.name || 'Unknown User'}</p>
                      <p>{message.content}</p>
                    </div>
                    {isCurrentUser && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMessage(message.id)}
                        aria-label="Delete message"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      
        <form onSubmit={handleSendMessage} className="border-t p-4">
          <div className="flex">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" disabled={isSending} className="ml-2">
              Send
            </Button>
          </div>
        </form>
      </div>
    );
  }
