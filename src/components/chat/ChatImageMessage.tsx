import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Message } from '@/types/message';
import { Loader2 } from 'lucide-react';

interface ChatImageMessageProps {
  message: Message;
}

interface ImageMetadata {
  type: 'image';
  imageUrl?: string;
  status: 'generating' | 'completed' | 'failed' | 'error';
  prompt?: string;
  jobId?: string;
}

export function ChatImageMessage({ message }: ChatImageMessageProps) {
  const [error, setError] = useState<string | null>(null);
  const metadata = message.metadata as unknown as ImageMetadata;

  useEffect(() => {
    const isImageMetadata = (metadata: any): metadata is ImageMetadata => {
      return metadata?.type === 'image' && typeof metadata?.status === 'string';
    };

    const pollImageStatus = async () => {
      try {
        const response = await fetch(`/api/image?jobId=${metadata?.jobId}&chatRoomId=${message.chatRoomId}&messageId=${message.id}`);
        if (!response.ok) throw new Error('Failed to check image status');
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        // Check both the RunPod status and message metadata
        const isGenerating = data.status === 'IN_PROGRESS' || 
                           data.status === 'IN_QUEUE' || 
                           data.status === 'STARTING' ||
                           (data.message?.metadata?.status === 'generating');

        if (isGenerating) {
          // Continue polling if still generating
          setTimeout(pollImageStatus, 2000);
        }
      } catch (err) {
        console.error('Error checking image status:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate image');
      }
    };

    if (isImageMetadata(metadata)) {
      if (metadata.status === 'generating' && metadata.jobId) {
        pollImageStatus();
      }
    }
  }, [message.metadata, message.id, message.chatRoomId, metadata?.jobId]);

  if (error || metadata?.status === 'error' || metadata?.status === 'failed') {
    return (
      <div className="text-red-500 mt-2">
        Failed to generate image
      </div>
    );
  }

  if (metadata?.status === 'generating') {
    return (
      <div className="flex items-center gap-2 text-gray-500 mt-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Generating image...
      </div>
    );
  }

  if (!metadata?.imageUrl) {
    return null;
  }

  return (
    <div className="mt-2">
      {metadata?.prompt && (
        <p className="mb-2 text-sm text-gray-600">{metadata.prompt}</p>
      )}
      <div className="relative w-[300px] h-[300px]">
        <Image 
          src={metadata.imageUrl}
          alt={metadata?.prompt || 'AI generated image'}
          fill
          className="rounded-lg object-cover"
          sizes="300px"
          priority
        />
      </div>
    </div>
  );
}
