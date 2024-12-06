import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { motion } from 'framer-motion';
import { slideIn } from '@/lib/utils/animations';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  isAIMessage: boolean;
  createdAt: string | Date;
  metadata?: {
    type?: string;
    audioData?: string;
    imageData?: string;
    isRead?: boolean;
    [key: string]: unknown;
  };
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  aiModel?: {
    imageUrl: string;
    name: string;
  };
}

interface MessageBubbleProps {
  message: Message;
  modelImage: string | null;
  isRead: boolean;
}

export function MessageBubble({ message, modelImage, isRead }: MessageBubbleProps) {
  const isAIMessage = message.isAIMessage;

  const formatMessageDate = (dateString: string | Date) => {
    try {
      const date = typeof dateString === 'string' 
        ? new Date(dateString.replace('Z', ''))
        : dateString;
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return '--:--';
    }
  };

  const renderMessageContent = () => {
    if (message.metadata?.type === 'voice') {
      return (
        <VoiceMessagePlayer
          audioUrl={message.metadata.audioData || ''}
          className={`max-w-[300px] ${isAIMessage ? 'bg-pink-500/10' : 'bg-secondary'}`}
        />
      );
    }

    if (message.metadata?.type === 'image') {
      return (
        <div className="relative w-64 h-64">
          <Image
            src={message.metadata.imageData || ''}
            alt="Generated image"
            fill
            className="object-cover rounded-lg"
          />
        </div>
      );
    }

    return (
      <div className={`px-4 py-2 rounded-2xl break-words ${
        isAIMessage
          ? 'bg-pink-500/10 text-foreground'
          : 'bg-secondary text-secondary-foreground'
      }`}>
        {message.content}
      </div>
    );
  };

  return (
    <motion.div
      variants={slideIn('up', 0.2)}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex gap-2 items-start ${isAIMessage ? '' : 'flex-row-reverse'}`}
    >
      <Avatar className="w-8 h-8">
        <AvatarImage
          src={isAIMessage ? modelImage || '' : message.user?.image || ''}
          alt={isAIMessage ? 'AI' : 'User'}
        />
      </Avatar>

      <div className={`flex flex-col gap-1 ${isAIMessage ? '' : 'items-end'}`}>
        {renderMessageContent()}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>{formatMessageDate(message.createdAt)}</span>
          {isAIMessage && isRead && (
            <span className="text-[10px] text-pink-500">Seen</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
