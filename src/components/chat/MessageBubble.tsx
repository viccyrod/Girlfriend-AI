import React, { useRef, useState } from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Play, Pause, Volume2 } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderMessageContent = () => {
    if (message.metadata?.type === 'voice_message' && message.metadata.audioData) {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayPause}
            className="p-2 rounded-full bg-pink-500/20 hover:bg-pink-500/30 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>
          <Volume2 className="w-4 h-4 text-pink-500" />
          <audio
            ref={audioRef}
            src={message.metadata.audioData}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
          <span className="text-sm opacity-70">Voice Message</span>
        </div>
      );
    }

    if (message.metadata?.type === 'image' && message.metadata.imageData) {
      return (
        <Image
          src={message.metadata.imageData}
          alt="Generated"
          width={300}
          height={300}
          className="max-w-[300px] rounded-lg object-cover"
        />
      );
    }

    return (
      <p className="text-sm md:text-base whitespace-pre-wrap break-words">
        {message.content}
      </p>
    );
  };

  return (
    <motion.div 
      variants={slideIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex ${isAIMessage ? 'justify-start' : 'justify-end'} mb-2 md:mb-4 group px-2 md:px-0`}
    >
      <div className={`flex ${isAIMessage ? 'flex-row' : 'flex-row-reverse'} items-end max-w-[85%] md:max-w-[75%]`}>
        <Avatar className={`hidden md:flex flex-shrink-0 ${isAIMessage ? 'mr-2' : 'ml-2'}`}>
          {message.aiModel?.imageUrl && (
            <Image
              src={message.aiModel.imageUrl}
              alt={`${message.aiModel.name}'s avatar`}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
          )}
          {!message.aiModel?.imageUrl && (
            <AvatarImage 
              src={isAIMessage ? (modelImage || '/user-placeholder.png') : (message.user?.image || '/user-placeholder.png')} 
              alt="Avatar" 
            />
          )}
        </Avatar>
        
        <div className={`flex flex-col ${isAIMessage ? 'items-start' : 'items-end'}`}>
          <div className={`rounded-lg px-3 py-2 md:px-4 md:py-2 ${
            isAIMessage 
              ? 'bg-secondary text-secondary-foreground' 
              : 'bg-primary text-primary-foreground'
          }`}>
            {renderMessageContent()}
            <p className="text-xs mt-1 opacity-70 text-right flex items-center gap-1 justify-end">
              {formatMessageDate(message.createdAt)}
              {!isAIMessage && isRead && (
                <span className="text-[10px] text-blue-400">Read</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
