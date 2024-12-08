import React from 'react';
import Image from 'next/image';
import { Message } from '@/types/message';
import { Loader2 } from 'lucide-react';

interface ChatImageMessageProps {
  message: Message;
}

export function ChatImageMessage({ message }: ChatImageMessageProps) {
  const metadata = message.metadata as Record<string, any>;
  const imageUrl = metadata?.imageUrl;
  const prompt = metadata?.prompt;
  const status = metadata?.status;

  if (!imageUrl && status !== 'generating') {
    return (
      <div className="text-sm text-muted-foreground">
        Failed to load image
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-[300px]">
      {prompt && (
        <p className="text-sm text-muted-foreground italic">
          {prompt}
        </p>
      )}
      {imageUrl && (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={prompt || 'Generated image'}
            fill
            className="object-cover"
            sizes="(max-width: 300px) 100vw, 300px"
          />
        </div>
      )}
      {status === 'generating' && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generating your image...</span>
        </div>
      )}
    </div>
  );
}
