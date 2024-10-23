'use client'; 
// This indicates the file is a client-side component in Next.js, meaning it can use hooks like useState and useEffect.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getChatRoomMessages, sendMessage } from '@/app/api/chat/actions'; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AIModel, ChatRoom, User } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types/chat'; 

import { useCurrentUser } from '@/hooks/useCurrentUser';
import { format } from 'date-fns';
import TextareaAutosize from 'react-textarea-autosize';

interface ExtendedChatRoom extends ChatRoom {
  users: User[];
  aiModel: AIModel | null;
}

interface ClientChatMessagesProps {
  chatRoom: ExtendedChatRoom;
}

type MessageUser = {
  id: string;
  name: string | null;
  image: string | null;
  imageUrl?: string;
};

const TypingIndicator = () => (
  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
  </div>
);

export default function ClientChatMessages({ chatRoom }: ClientChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const handleSendMessageRef = useRef<(e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => void>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchMessages = useCallback(async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        const fetchedMessages = await getChatRoomMessages(chatRoom.id);
        const messagesWithUser = fetchedMessages.map((msg: Message) => ({
          ...msg,
          user: msg.user || chatRoom.users.find(user => user.id === msg.userId) || 
                { id: msg.userId || '', name: 'Unknown User', image: null },
          userId: msg.userId || ''
        }));
        setMessages(messagesWithUser as Message[]);
        return;
      } catch (error) {
        retries -= 1;
        console.error('Failed to fetch messages:', error);
        if (retries === 0) {
          toast({
            title: "Error",
            description: "Failed to load messages. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  }, [chatRoom.id, chatRoom.users, toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/chat/${chatRoom.id}/sse`);
    eventSource.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };
    eventSource.onerror = () => {
      toast({
        title: "Connection lost",
        description: "Unable to connect to the server. Please refresh the page.",
        variant: "destructive",
      });
      eventSource.close();
    };
    return () => eventSource.close();
  }, [chatRoom.id, toast]);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Function to prepare message payload
  const prepareUserMessage = () => ({
    content: newMessage.trim(),
    userId: currentUser?.id || '',
    chatRoomId: chatRoom.id,
    aiModelId: null,
    isAIMessage: false,
  });

  // // Function to handle sent message
  // const handleSentMessage = (sentMessage: Message) => {
  //   const sentMessageWithUser = {
  //     ...sentMessage,
  //     user: chatRoom.users.find(user => user.id === sentMessage.userId) || 
  //           { id: sentMessage.userId || '', name: 'Unknown User', image: null },
  //     userId: sentMessage.userId || ''
  //   };
    
  //   setMessages(prevMessages => [
  //     ...prevMessages.filter(msg => msg.id !== `temp-${sentMessage.createdAt}`), // Adjust if temp id is different
  //     sentMessageWithUser
  //   ]);
  // };

  const handleSendMessage = useCallback(async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: newMessage.trim(),
      userId: currentUser?.id || '',
      chatRoomId: chatRoom.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: currentUser ?? { id: '', name: 'Unknown User', image: null },
      isAIMessage: false,
      aiModelId: null, // or provide a default value if required
    };

    setMessages(prevMessages => [...prevMessages, tempMessage]);
    setNewMessage('');
    setIsSending(true);

    try {
      const { userMessage: savedUserMessage, aiMessage } = await sendMessage(chatRoom.id, prepareUserMessage());
      setMessages(prevMessages => [
        ...prevMessages.filter(msg => msg.id !== savedUserMessage.id),
        savedUserMessage,
        aiMessage
      ]);
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
  }, [newMessage, isSending, chatRoom.id, prepareUserMessage, currentUser, toast]);

  handleSendMessageRef.current = handleSendMessage;

  // const handleDeleteMessage = async (messageId: string) => {
  //   const userConfirmed = window.confirm('Are you sure you want to delete this message?');
  //   if (!userConfirmed) return;

  //   try {
  //     await deleteMessage(chatRoom.id, messageId);
  //     setMessages(prevMessages => prevMessages.filter(msg => msg.id !== messageId));
  //   } catch (error) {
  //     console.error('Failed to delete message:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to delete message. Please try again.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
      e.preventDefault();
      handleSendMessageRef.current?.(e);
    }
  };

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col"
      >
        {messages.map((message) => {
          const isAIMessage = message.isAIMessage;
          const messageUser = isAIMessage ? chatRoom.aiModel : (message.user || { name: 'Unknown User', image: null });

          return (
            <div key={message.id} className={`flex ${!isAIMessage ? 'justify-end' : 'justify-start'} mb-4 group`}>
              <div className={`flex ${!isAIMessage ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                <div className="flex-shrink-0 mr-3">
                  <Avatar>
                    <AvatarImage 
                      className="object-cover w-10 h-10" 
                      src={(messageUser as MessageUser).imageUrl ?? (messageUser as MessageUser).image ?? '/default-avatar.png'}
                      alt={(messageUser as MessageUser).name ?? 'Unknown'} 
                    />
                    <AvatarFallback>{(messageUser as MessageUser).name?.[0] ?? '?'}</AvatarFallback>
                  </Avatar>
                </div>
                <div className={`flex flex-col ${!isAIMessage ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-2 ${!isAIMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className="text-xs mt-1 opacity-70 text-right">
                      {format(new Date(message.createdAt), 'HH:mm')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 group-hover:opacity-100 opacity-0 transition-opacity duration-200">
                    {messageUser?.name ?? 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {isSending && (
          <div className="flex justify-start mb-4">
            <TypingIndicator />
          </div>
        )}
      </div>
      
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex items-center">
          <TextareaAutosize
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 mr-2 resize-none rounded-md border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            minRows={1}
          />
          <Button type="submit" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
