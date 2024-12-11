import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Message } from '@/types/message';
import { Loader2 } from 'lucide-react';

interface ChatImageMessageProps {
  message: Message;
  className?: string;
}

export function ChatImageMessage({ message, className }: ChatImageMessageProps) {
  const metadata = message.metadata as { status?: string; imageUrl?: string; prompt?: string };
  const status = metadata?.status || 'generating';
  const imageUrl = metadata?.imageUrl;
  const prompt = metadata?.prompt;

  if (status === 'generating') {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {prompt && (
          <p className="text-sm text-muted-foreground italic">
            Generating: {prompt}
          </p>
        )}
        <div className="animate-pulse bg-muted rounded-lg w-[512px] max-w-full">
          <div className="w-full h-[512px] bg-muted-foreground/10 rounded-lg flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={cn("bg-destructive/10 text-destructive p-4 rounded-lg w-[512px] max-w-full", className)}>
        Failed to generate image
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className={cn("bg-destructive/10 text-destructive p-4 rounded-lg w-[512px] max-w-full", className)}>
        No image URL available
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {prompt && (
        <p className="text-sm text-muted-foreground italic">
          {prompt}
        </p>
      )}
      <div className="relative rounded-lg overflow-hidden w-[512px] max-w-full">
        <div className="aspect-square relative">
          <Image
            src={imageUrl}
            alt={prompt || "Generated image"}
            fill
            sizes="(max-width: 512px) 100vw, 512px"
            className="object-cover rounded-lg"
            priority
          />
        </div>
      </div>
    </div>
  );
}
