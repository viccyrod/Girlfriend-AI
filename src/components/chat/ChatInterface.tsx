'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import TextareaAutosize from 'react-textarea-autosize';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isAIMessage: boolean;
  createdAt: Date;
}

export function ChatInterface({ modelId, modelName, modelImage }: { 
  modelId: string;
  modelName: string;
  modelImage: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: input,
      isAIMessage: false,
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: input, 
          modelId 
        }),
      });

      const data = await response.json();
      
      // Add AI response
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: data.response,
        isAIMessage: true,
        createdAt: new Date(),
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.isAIMessage ? 'flex-row' : 'flex-row-reverse'}`}
          >
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={msg.isAIMessage ? modelImage : '/user-placeholder.png'}
                alt={msg.isAIMessage ? modelName : 'User'}
              />
            </Avatar>
            <div
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.isAIMessage ? 'bg-gray-800' : 'bg-pink-600'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={modelImage}
                alt={modelName}
              />
            </Avatar>
            <div className="p-3 rounded-lg max-w-[80%] bg-gray-800">
              <span className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-800">
        <div className="flex gap-2">
          <TextareaAutosize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-background resize-none rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
            maxRows={5}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}