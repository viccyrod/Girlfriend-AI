import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { motion } from 'framer-motion';
import { slideIn } from '@/lib/utils/animations';
import Image from 'next/image';
import { ChatImageMessage } from './ChatImageMessage';
import { Message, MessageMetadata } from '@/types/message';

interface MessageBubbleProps {
  message: Message;
  modelImage: string | null;
  isRead: boolean;
}

export function MessageBubble({ message, modelImage, isRead }: MessageBubbleProps) {
  const isAIMessage = message.isAIMessage;

  const formatMessageDate = (dateString: Date) => {
    try {
      return format(dateString, 'HH:mm');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return '--:--';
    }
  };

  const renderMessageContent = () => {
    if (message.metadata?.type === 'voice_message' && 'audioData' in message.metadata) {
      return (
        <VoiceMessagePlayer
          audioUrl={message.metadata.audioData || ''}
          className={`max-w-[300px] ${isAIMessage ? 'bg-pink-500/10' : 'bg-secondary'}`}
        />
      );
    }

    if (message.metadata?.type === 'image') {
      return <ChatImageMessage message={message} />;
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
