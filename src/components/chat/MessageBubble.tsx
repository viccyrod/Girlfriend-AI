import React from 'react';
import Image from 'next/image';
import { Message } from '@/types/message';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MessageBubbleProps {
  message: Message;
  isRead: boolean;
  modelImage: string | null;
  isLastInGroup: boolean;
  showTimestamp: boolean;
  timestamp: string;
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isRead,
  modelImage,
  isLastInGroup,
  showTimestamp,
  timestamp
}: MessageBubbleProps) {
  const isAI = message.isAIMessage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-3",
        isAI ? "justify-start" : "justify-end",
        !isLastInGroup && "mb-1"
      )}
    >
      {isAI && modelImage && (
        <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden">
          <Image
            src={modelImage}
            alt="AI Avatar"
            width={32}
            height={32}
            className="object-cover"
            sizes="32px"
          />
        </div>
      )}

      <div className={cn("group relative max-w-[80%] break-words", isAI ? "order-2" : "order-1")}>
        <div
          className={cn(
            "px-4 py-2 rounded-2xl",
            isAI ? "bg-[#1a1a1a] text-white" : "bg-pink-500 text-white",
            isLastInGroup ? "rounded-bl-2xl" : "rounded-bl-lg",
          )}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        {showTimestamp && (
          <div 
            className={cn(
              "text-xs text-white/30 mt-1",
              isAI ? "text-left" : "text-right"
            )}
          >
            {timestamp}
          </div>
        )}
      </div>

      {!isAI && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center order-3">
          <span className="text-xs text-pink-500">You</span>
        </div>
      )}
    </motion.div>
  );
});
