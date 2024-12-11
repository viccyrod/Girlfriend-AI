import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Play, Pause, Clock, ExternalLink, UserCircle2, Bot } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Message } from '@/types/message';

interface MessageBubbleProps {
  message: Message;
  isRead: boolean;
  modelImage: string | null;
  isLastMessage: boolean;
}

export function MessageBubble({ message, isRead, modelImage, isLastMessage }: MessageBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayVoice = (audioData?: string | null) => {
    if (!audioData) return;
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    const newAudio = new Audio(audioData);
    newAudio.addEventListener('timeupdate', () => {
      setAudioProgress((newAudio.currentTime / newAudio.duration) * 100);
    });
    newAudio.addEventListener('loadedmetadata', () => {
      setAudioDuration(newAudio.duration);
    });
    newAudio.addEventListener('ended', () => {
      setIsPlaying(false);
      setAudioProgress(0);
    });
    audioRef.current = newAudio;
    newAudio.play();
    setIsPlaying(true);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.remove();
      }
    };
  }, []);

  return (
    <div
      className={cn(
        "group flex gap-3 w-full transition-all duration-200",
        message.isAIMessage ? "justify-start" : "justify-end",
        isLastMessage && "opacity-100",
        !isLastMessage && "opacity-90 hover:opacity-100"
      )}
    >
      {message.isAIMessage && (
        <div className="flex-shrink-0 w-8 h-8">
          {modelImage ? (
            <Image
              src={modelImage}
              alt="AI Avatar"
              width={32}
              height={32}
              className="rounded-full object-cover ring-2 ring-pink-500/20 group-hover:ring-pink-500/40 transition-all duration-300"
              sizes="32px"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-pink-500" />
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "relative group flex-1 max-w-[85%] md:max-w-[75%]",
          message.isAIMessage ? "items-start" : "items-end"
        )}
      >
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl break-words",
            "transform transition-all duration-200 hover:scale-[1.01]",
            message.isAIMessage
              ? "bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/5 hover:bg-[#1a1a1a] hover:border-pink-500/20"
              : "bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 hover:shadow-xl hover:shadow-pink-500/20",
            message.metadata?.type === 'image' && "p-2 bg-transparent",
            "shadow-lg"
          )}
        >
          {/* Text Message */}
          {(!message.metadata || message.metadata.type === 'text') && (
            <div className="space-y-2">
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{message.content}</p>
              <div className={cn(
                "flex items-center gap-1 text-xs opacity-0 transition-opacity duration-200",
                "group-hover:opacity-100",
                message.isAIMessage ? "text-gray-400" : "text-white/70"
              )}>
                <Clock className="w-3 h-3" />
                {format(new Date(message.createdAt), 'HH:mm')}
              </div>
            </div>
          )}

          {/* Image Message */}
          {message.metadata?.type === 'image' && message.metadata.imageUrl && (
            <div className="relative aspect-square w-64 rounded-xl overflow-hidden ring-4 ring-pink-500/20 hover:ring-pink-500/40 transition-all duration-300">
              <Image
                src={message.metadata.imageUrl}
                alt="Generated image"
                fill
                sizes="(max-width: 768px) 100vw, 256px"
                className="object-cover transition-transform duration-300 hover:scale-105"
              />
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
                  onClick={() => message.metadata?.imageUrl && window.open(message.metadata.imageUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Voice Message */}
          {message.metadata?.type === 'voice_message' && (
            <div className="flex items-center gap-3 min-w-[200px] max-w-[300px]">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handlePlayVoice(message.metadata?.audioData)}
                className={cn(
                  "h-8 w-8 rounded-full",
                  "hover:bg-pink-500/10 text-pink-500/80 hover:text-pink-500",
                  "transition-colors duration-200"
                )}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <div className="flex-1">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-600 rounded-full transition-all duration-200"
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
                <span className="text-xs text-white/70 mt-1.5 block">
                  {format(audioDuration * 1000, 'mm:ss')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!message.isAIMessage && (
        <div className="flex-shrink-0 w-8 h-8">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <UserCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
