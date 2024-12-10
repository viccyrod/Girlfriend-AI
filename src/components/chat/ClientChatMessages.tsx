'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TextareaAutosize from 'react-textarea-autosize';
import { Send, ImageIcon, Mic, Loader2 } from 'lucide-react';
import { ImageGenerationMenu } from './ImageGenerationMenu';
import { VoiceMessage } from './VoiceMessage';
import { MessageBubble } from './MessageBubble';
import { Message, MessageMetadata } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';
import { useSSEConnection } from '@/hooks/useSSEConnection';
import { useMessageBatching } from '@/hooks/useMessageBatching';
import { useVirtualMessages } from '@/hooks/useVirtualMessages';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const PAGE_SIZE = 30;

  // Initialize message state with chat room messages
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
    }))
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // Use SSE for real-time updates
  useSSEConnection({
    url: `/api/chat/${chatRoom.id}/subscribe`,
    onMessage: (data) => {
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    },
    onError: (error) => {
      console.error('SSE error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to receive real-time updates",
        variant: "destructive"
      });
    }
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    // Add a small delay to ensure the DOM has updated
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoadingResponse) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsLoadingResponse(true);

    try {
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        isAIMessage: false,
        userId: null,
        chatRoomId: chatRoom.id,
        aiModelId: null,
        metadata: { type: 'text' } as MessageMetadata,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null
      };

      // Add message to UI
      setMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom('smooth');

      // Send message to server first
      await onSendMessage(content);

      // Then start streaming
      setIsStreaming(true);
      const streamResponse = await fetch(`/api/chat/${chatRoom.id}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, optimisticMessage].map(msg => ({
            role: msg.isAIMessage ? 'assistant' : 'user',
            content: msg.content
          }))
        })
      });

      if (!streamResponse.ok) throw new Error('Failed to get AI response');

      const reader = streamResponse.body?.getReader();
      if (!reader) throw new Error('No response reader available');

      // Create streaming message placeholder
      const streamingMessagePlaceholder: Message = {
        id: `stream-${Date.now()}`,
        content: '',
        isAIMessage: true,
        userId: null,
        chatRoomId: chatRoom.id,
        aiModelId: chatRoom.aiModel?.id || null,
        metadata: { type: 'text', streaming: true } as MessageMetadata,
        role: 'assistant',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: null
      };

      setMessages(prev => [...prev, streamingMessagePlaceholder]);
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
              
              // Update streaming message in place
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessagePlaceholder.id
                  ? { ...msg, content: streamedContent }
                  : msg
              ));
              
              scrollToBottom('auto');
            } catch (e) {
              console.error('Error parsing streaming response:', e);
            }
          }
        }
      }

      // Keep the streamed message until the final SSE message arrives
      // The SSE message will replace this one with the final version
      setIsStreaming(false);
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResponse(false);
    }
  }, [messages, newMessage, isLoadingResponse, chatRoom.id, onSendMessage, scrollToBottom]);

  const handleImageGeneration = async (prompt: string) => {
    try {
      setIsGeneratingImage(true);
      
      // Create optimistic message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: `🎨 Generating image: "${prompt}"...`,
        chatRoomId: chatRoom.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIMessage: true,
        metadata: { type: 'image', status: 'generating', prompt } as MessageMetadata,
        userId: null,
        aiModelId: chatRoom.aiModel?.id || null,
        role: 'assistant',
        user: null
      };

      setMessages(prev => [...prev, optimisticMessage]);
      scrollToBottom('smooth');

      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          chatRoomId: chatRoom.id,
          style: 'realistic'
        }),
      });

      if (!response.ok) throw new Error('Failed to generate image');
      
      const { jobId, message: initialMessage } = await response.json();

      // Start polling for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/image?jobId=${jobId}&chatRoomId=${chatRoom.id}&messageId=${initialMessage.id}`);
          if (!statusResponse.ok) throw new Error('Failed to check image status');
          
          const statusData = await statusResponse.json();
          if ((statusData.message?.metadata?.status === 'completed' || statusData.status === 'COMPLETED') && statusData.message) {
            setMessages(prev => prev.map(msg => 
              msg.id === optimisticMessage.id ? statusData.message : msg
            ));
            clearInterval(pollInterval);
            setIsGeneratingImage(false);
          } else if (statusData.status === 'FAILED') {
            throw new Error('Image generation failed');
          }
        } catch (error) {
          console.error('Error polling image status:', error);
          clearInterval(pollInterval);
          setIsGeneratingImage(false);
          
          setMessages(prev => prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? {
                  ...msg,
                  content: 'Failed to generate image. Please try again.',
                  metadata: { type: 'image', status: 'error' } as MessageMetadata
                }
              : msg
          ));

          toast({
            title: "Error",
            description: "Failed to check image status. Please try again.",
            variant: "destructive"
          });
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollInterval);
        setIsGeneratingImage(false);
      }, 5 * 60 * 1000);

    } catch (error) {
      console.error('Error generating image:', error);
      setIsGeneratingImage(false);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="flex flex-col min-h-full p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
              Start a conversation
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                modelImage={chatRoom.aiModel?.imageUrl || null}
                isRead={true}
              />
            ))
          )}
          {isStreaming && streamingMessage && (
            <MessageBubble
              message={{
                id: 'streaming',
                content: streamingMessage,
                isAIMessage: true,
                chatRoomId: chatRoom.id,
                aiModelId: chatRoom.aiModel?.id || null,
                metadata: { type: 'text' },
                role: 'assistant',
                createdAt: new Date(),
                updatedAt: new Date(),
                userId: null,
                user: null
              }}
              modelImage={chatRoom.aiModel?.imageUrl || null}
              isRead={true}
            />
          )}
          <div ref={messagesEndRef} className="h-px w-full" />
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 border-t border-[#1a1a1a] bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[#1E1B2C] rounded-lg px-2 md:px-4 py-2 min-w-0">
            <div className="flex-shrink-0">
              <ImageGenerationMenu 
                chatRoom={chatRoom}
                onGenerate={handleImageGeneration}
                isGenerating={isGeneratingImage}
              />
            </div>
            
            <div className="flex-1 min-w-0">
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
                className="w-full bg-transparent border-none focus:outline-none resize-none text-sm md:text-base placeholder:text-muted-foreground"
                maxRows={5}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            size="icon"
            disabled={isLoading || !newMessage.trim()}
            className="bg-[#392C72] hover:bg-[#2D2259] transition-colors flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center"
          >
            <Send className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </Button>
        </form>
      </div>
    </div>
  );
}
