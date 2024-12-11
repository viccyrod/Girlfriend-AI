import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Message } from '@/types/message';
import { Loader2, ImageIcon, Camera, Sparkles } from 'lucide-react';
import { MessageMetadata } from '@/types/chat';

interface ChatImageMessageProps {
  message: Message;
  className?: string;
}

export function ChatImageMessage({ message, className }: ChatImageMessageProps) {
  const metadata = message.metadata as MessageMetadata;
  const status = metadata?.status || 'generating';
  const imageUrl = metadata?.imageUrl;
  const prompt = metadata?.prompt;

  console.log('🖼️ Rendering image message:', { 
    id: message.id, 
    status, 
    imageUrl: imageUrl ? `${imageUrl.substring(0, 50)}...` : 'none',
    metadata
  });

  // Only show loading state if we're actually generating
  if (status === 'generating' && !imageUrl) {
    return (
      <div className={cn("flex flex-col gap-2 w-full", className)}>
        {prompt && (
          <p className="text-sm text-white/60 italic">
            {prompt}
          </p>
        )}
        <div className="animate-pulse bg-[#1a1a1a] rounded-lg w-full">
          <div className="aspect-square w-full bg-[#2a2a2a] rounded-lg flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative z-10 p-4 rounded-full bg-[#1a1a1a] border border-white/10">
                <Camera className="w-8 h-8 text-pink-500 animate-[spin_3s_ease-in-out_infinite]" />
              </div>
            </div>
            <p className="text-sm text-white/40">
              Generating your image...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={cn("bg-red-500/10 text-red-500 p-4 rounded-lg w-full", className)}>
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="w-8 h-8" />
          <p>Failed to generate image</p>
          <p className="text-sm text-red-400">{prompt}</p>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    console.error('❌ No image URL for completed message:', message);
    return (
      <div className={cn("bg-[#1a1a1a] text-white/40 p-4 rounded-lg w-full", className)}>
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="w-8 h-8" />
          <p>No image available</p>
          <p className="text-sm">{prompt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2 w-full group", className)}>
      {prompt && (
        <p className="text-sm text-white/60 italic">
          {prompt}
        </p>
      )}
      <div className="relative rounded-lg overflow-hidden w-full bg-[#1a1a1a]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="aspect-square relative">
          <Image
            src={imageUrl}
            alt={prompt || "Generated image"}
            fill
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover rounded-lg"
            priority
            onError={(e) => {
              console.error('❌ Failed to load image:', imageUrl);
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.jpg';
            }}
          />
        </div>
      </div>
    </div>
  );
}
