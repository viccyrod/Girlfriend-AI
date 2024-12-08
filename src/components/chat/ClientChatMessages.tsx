'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TextareaAutosize from 'react-textarea-autosize';
import { Send } from 'lucide-react';
import { ImageGenerationMenu } from './ImageGenerationMenu';
import { VoiceMessage } from './VoiceMessage';
import { MessageBubble } from './MessageBubble';
import { Message, MessageMetadata } from '@/types/message';
import { ExtendedChatRoom } from '@/types/chat';
import Image from 'next/image';
import { cn } from '@/lib/utils';

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
  const scrollTimeout = useRef<NodeJS.Timeout>();

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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message}
            modelImage={chatRoom.aiModel?.imageUrl || ''}
            isRead={true}
          />
        ))}
        {isStreaming && streamingMessage && (
          <MessageBubble
            message={{
              id: 'streaming',
              content: streamingMessage,
              isAIMessage: true,
              userId: null,
              user: null,
              chatRoomId: chatRoom.id,
              aiModelId: null,
              metadata: { type: 'text' },
              role: 'assistant',
              createdAt: new Date(),
              updatedAt: new Date()
            }}
            modelImage={chatRoom.aiModel?.imageUrl || ''}
            isRead={true}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-800 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <ImageGenerationMenu 
            chatRoom={chatRoom}
            setIsLoadingResponse={setIsLoadingResponse}
            onClose={() => {}}
          />
          <VoiceMessage
            onVoiceMessage={async () => {}}
            isRecording={false}
            setIsRecording={() => {}}
          />
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="w-full p-2 bg-background rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-primary min-h-[40px] max-h-[200px]"
              rows={1}
            />
          </div>
          <Button 
            type="submit" 
            size="icon"
            disabled={!newMessage.trim() || isLoadingResponse}
            className={cn(
              "rounded-full w-10 h-10",
              isLoadingResponse && "opacity-50 cursor-not-allowed"
            )}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
