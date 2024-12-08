'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, ImageIcon, Mic } from 'lucide-react';
import { ImageGenerationMenu } from './ImageGenerationMenu';
import { VoiceMessage } from './VoiceMessage';
import { MessageBubble } from './MessageBubble';
import { Message, MessageMetadata } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClientChatMessagesProps {
  chatRoom: ExtendedChatRoom;
  onSendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  isGeneratingResponse: boolean;
}

export default function ClientChatMessages({ 
  chatRoom, 
  onSendMessage, 
  isLoading, 
  isGeneratingResponse 
}: ClientChatMessagesProps) {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const PAGE_SIZE = 30;

  // State
  const [messages, setMessages] = useState<Message[]>(
    chatRoom.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      chatRoomId: msg.chatRoomId,
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      isAIMessage: msg.isAIMessage || false,
      aiModelId: msg.aiModelId || null,
      userId: msg.userId || null,
      user: msg.user || null,
      role: msg.role || 'user',
      metadata: {
        type: 'text',
        ...(typeof msg.metadata === 'object' ? msg.metadata : {})
      } as MessageMetadata
    })) || []
  );
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Load initial messages
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const response = await fetch(`/api/chat/${chatRoom.id}/messages?limit=${PAGE_SIZE}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const data = await response.json();
        setMessages(data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          chatRoomId: msg.chatRoomId,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
          isAIMessage: msg.isAIMessage || false,
          aiModelId: msg.aiModelId || null,
          userId: msg.userId || null,
          user: msg.user || null,
          role: msg.role || 'user',
          metadata: {
            type: 'text',
            ...(typeof msg.metadata === 'object' ? msg.metadata : {})
          } as MessageMetadata
        })));
        setHasMoreMessages(data.hasMore);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive"
        });
      }
    };

    fetchInitialMessages();
  }, [chatRoom.id, toast]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    if (target.scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, isLoadingMore]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!hasMoreMessages || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const oldestMessageId = messages[0]?.id;
      const response = await fetch(
        `/api/chat/${chatRoom.id}/messages?before=${oldestMessageId}&limit=${PAGE_SIZE}`
      );
      if (!response.ok) throw new Error('Failed to fetch more messages');
      
      const data = await response.json();
      const newMessages = data.messages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        chatRoomId: msg.chatRoomId,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        isAIMessage: msg.isAIMessage || false,
        aiModelId: msg.aiModelId || null,
        userId: msg.userId || null,
        user: msg.user || null,
        role: msg.role || 'user',
        metadata: {
          type: 'text',
          ...(typeof msg.metadata === 'object' ? msg.metadata : {})
        } as MessageMetadata
      }));

      // Save scroll position
      const scrollArea = scrollAreaRef.current;
      const oldHeight = scrollArea?.scrollHeight || 0;

      setMessages(prev => [...newMessages, ...prev]);
      setHasMoreMessages(data.hasMore);

      // Restore scroll position
      if (scrollArea) {
        const newHeight = scrollArea.scrollHeight;
        scrollArea.scrollTop = newHeight - oldHeight;
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast({
        title: "Error",
        description: "Failed to load more messages",
        variant: "destructive"
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [chatRoom.id, hasMoreMessages, isLoadingMore, messages, toast]);

  // Scroll to bottom on new messages
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const shouldScrollToBottom = 
      scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 100;

    if (shouldScrollToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingMessage]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoadingResponse) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsLoadingResponse(true);

    try {
      // Create a temporary message object
      const tempMessage: Message = {
        id: Date.now().toString(),
        content,
        isAIMessage: false,
        userId: null,
        chatRoomId: chatRoom.id,
        aiModelId: null,
        metadata: {
          type: 'text'
        } as MessageMetadata,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add the message to the UI immediately
      setMessages(prev => [...prev, tempMessage]);

      // Send the message
      await onSendMessage(content);

      // Start streaming the AI response
      setIsStreaming(true);
      const response = await fetch(`/api/chat/${chatRoom.id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(tempMessage).map(msg => ({
            role: msg.isAIMessage ? 'assistant' : 'user',
            content: msg.content
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response reader available');

      let streamedContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              streamedContent += content;
              setStreamingMessage(streamedContent);
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          }
        }
      }

      // Create final AI message
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: streamedContent,
        isAIMessage: true,
        userId: null,
        user: null,
        chatRoomId: chatRoom.id,
        aiModelId: null,
        metadata: { type: 'text' },
        role: 'assistant',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setStreamingMessage('');
      setIsStreaming(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResponse(false);
    }
  }, [newMessage, isLoadingResponse, messages, chatRoom.id, chatRoom.aiModelId, onSendMessage, toast]);

  const handleVoiceMessage = useCallback(async (blob: Blob) => {
    const file = new File([blob], 'voice_message.wav');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`/api/chat/${chatRoom.id}/voice`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to send voice message');

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
    } catch (error) {
      console.error('Error sending voice message:', error);
      toast({
        title: "Error",
        description: "Failed to send voice message",
        variant: "destructive"
      });
    }
  }, [chatRoom.id, toast]);

  const handleImageGeneration = async (prompt: string) => {
    try {
      setIsGeneratingImage(true);
      
      // Create an optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: `🎨 Generating image: "${prompt}"...`,
        chatRoomId: chatRoom.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIMessage: true,
        metadata: { type: 'image', status: 'generating', prompt } as MessageMetadata,
        userId: null,
        aiModelId: chatRoom.aiModelId,
        role: 'assistant',
        user: null
      };

      // Add optimistic message
      setMessages(prev => [...prev, optimisticMessage]);

      // Scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

      // Make the API call
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          chatRoomId: chatRoom.id,
          style: 'realistic'
        }),
      });

      if (!response.ok) throw new Error('Failed to generate image');
      
      const data = await response.json();

      // Update messages with the real image
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticMessage.id 
          ? {
              ...msg,
              content: `Generated image for: "${prompt}"`,
              metadata: {
                type: 'image',
                status: 'complete',
                imageUrl: data.imageUrl,
                prompt
              } as MessageMetadata
            }
          : msg
      ));

      toast({
        title: "Image generated",
        description: "Your image has been generated successfully",
      });

    } catch (error) {
      console.error('Error generating image:', error);
      
      // Update the optimistic message to show error
      setMessages(prev => prev.map(msg => 
        msg.id.startsWith('temp-') 
          ? {
              ...msg,
              content: 'Failed to generate image. Please try again.',
              metadata: { type: 'image', status: 'error' } as MessageMetadata
            }
          : msg
      ));

      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea 
        ref={scrollAreaRef as any}
        className="flex-1"
        onScroll={handleScroll}
      >
        <div className="p-4 space-y-4">
          {isLoadingMore && (
            <div className="text-center py-2 text-muted-foreground">
              Loading more messages...
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              modelImage={chatRoom.aiModel?.imageUrl || ''}
              isRead={true}
            />
          ))}
          {streamingMessage && (
            <MessageBubble
              message={{
                id: 'streaming',
                content: streamingMessage,
                isAIMessage: true,
                userId: null,
                aiModelId: null,
                chatRoomId: chatRoom.id,
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata: { type: 'text' } as MessageMetadata,
                role: 'assistant',
                user: null
              }}
              modelImage={chatRoom.aiModel?.imageUrl || ''}
              isRead={true}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="flex-shrink-0 border-t border-[#1a1a1a] bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#1E1B2C] rounded-lg px-4 py-2">
            <ImageGenerationMenu 
              chatRoom={chatRoom}
              onGenerate={handleImageGeneration}
              isGenerating={isGeneratingImage}
            />
            <div className="flex-1">
              <TextareaAutosize
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                className="w-full bg-transparent border-none focus:outline-none resize-none text-base placeholder:text-muted-foreground"
                maxRows={5}
              />
            </div>
          </div>
          <Button 
            type="submit" 
            size="icon"
            disabled={isLoading || !newMessage.trim()}
            className={cn(
              "bg-[#392C72] hover:bg-[#2D2259] transition-colors",
              isLoading && "opacity-50 cursor-not-allowed",
              "h-10 w-10 rounded-full flex items-center justify-center"
            )}
          >
            <Send className="h-5 w-5 text-white" />
          </Button>
        </form>
      </div>
    </div>
  );
}
