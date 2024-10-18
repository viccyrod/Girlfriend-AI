'use client'; 
// This indicates the file is a client-side component in Next.js, meaning it can use hooks like useState and useEffect.

import React, { useState, useEffect, useRef, useCallback } from 'react';
// Importing necessary React hooks. useState manages local state, useEffect handles side effects, 
// useRef creates a persistent reference, and useCallback memoizes a function to prevent unnecessary re-creations.

import { getChatRoomMessages, sendMessage } from '@/app/api/chat/client-actions';
// Importing API functions to fetch chat messages and send new messages.

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// UI components for displaying user avatars (images or fallback if unavailable).

import { Button } from '@/components/ui/button';
// A styled button component.

import { Input } from '@/components/ui/input';
// A styled input component for user interaction.

import { ToastProvider, Toast } from '@/components/ui/toast';
// Components for displaying toasts (user notifications).

import { ChatRoom } from '@prisma/client';
// ChatRoom type definition, assuming Prisma is being used for database management.

import { useToast } from '@/hooks/use-toast';
// A custom hook to trigger toasts for success or error messages.

import { Message } from '@/types/chat'; 
// Ensures that the Message type is defined and imported for type safety.

interface ClientChatMessagesProps {
  chatRoom: ChatRoom;
}
// TypeScript interface to define the expected props for this component, specifically a chatRoom object.

export default function ClientChatMessages({ chatRoom }: ClientChatMessagesProps) {
    // The main functional component that takes in a chatRoom prop.
  
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [chatRoomExists, setChatRoomExists] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
  
    const fetchMessages = useCallback(async () => {
      setIsLoading(true);
      try {
        const fetchedMessages = await getChatRoomMessages(chatRoom.id);
        setMessages(fetchedMessages as unknown as Message[]);
        setChatRoomExists(true);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        if (error instanceof Error && error.message === 'Chat room not found') {
          setChatRoomExists(false);
          toast({
            title: "Chat Room Not Found",
            description: "This chat room no longer exists.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load messages. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }, [chatRoom.id, toast]);
  
    useEffect(() => {
      fetchMessages();
    }, [fetchMessages]);
  
    useEffect(() => {
      scrollToBottom();
    }, [messages]);
  
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
  
    const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!newMessage.trim() || isSending || !chatRoomExists) return;
  
      setIsSending(true);
      try {
        const sentMessage = await sendMessage(newMessage, chatRoom.id);
        setMessages((prevMessages) => [...prevMessages, sentMessage as unknown as Message]);
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
  
    if (!chatRoomExists) {
      return <div className="text-center p-4">This chat room no longer exists.</div>;
    }
  
    if (isLoading) {
      return <div className="text-center p-4">Loading messages...</div>;
    }
  
    return (
        <div className="flex flex-col h-screen">
        {/* Main container that takes the full height of the screen */}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Chat message container that can scroll but doesn't push the Send button off-screen */}
          
          {messages.map((message) => (
            <div key={message.id} className="flex items-start space-x-2">
              <Avatar>
                <AvatarImage src={message.user.image || undefined} alt={message.user.name || ''} />
                <AvatarFallback>{message.user.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{message.user.name}</p>
                <p className="text-foreground">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
          {/* Scroll to this reference when a new message is added */}
        </div>
      
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-background">
          {/* Input form fixed at the bottom of the chat interface */}
          
          <div className="flex space-x-2">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={!chatRoomExists}
            />
            <Button type="submit" disabled={isSending || !chatRoomExists}>
              Send
            </Button>
          </div>
        </form>
      </div>
    );
  }
