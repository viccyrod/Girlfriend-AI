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
  status: 'generating' | 'completed' | 'failed';
  prompt?: string;
  jobId?: string;
}

export function ChatImageMessage({ message }: ChatImageMessageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isImageMetadata = (metadata: any): metadata is ImageMetadata => {
      return metadata?.type === 'image' && typeof metadata?.status === 'string';
    };

    const pollImageStatus = async () => {
      try {
        const response = await fetch(`/api/image?jobId=${message.metadata?.jobId}&chatRoomId=${message.chatRoomId}&messageId=${message.id}`);
        if (!response.ok) throw new Error('Failed to check image status');
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        if (data.message?.metadata?.imageUrl) {
          setImageUrl(data.message.metadata.imageUrl);
        } else if (data.message?.metadata?.status === 'generating') {
          // Continue polling if still generating
          setTimeout(pollImageStatus, 2000);
        }
      } catch (err) {
        console.error('Error checking image status:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate image');
      }
    };

    if (isImageMetadata(message.metadata)) {
      if (message.metadata.status === 'generating' && message.metadata.jobId) {
        pollImageStatus();
      } else if (message.metadata.imageUrl) {
        setImageUrl(message.metadata.imageUrl);
      }
    }
  }, [message.metadata, message.id, message.chatRoomId]);

  if (error) {
    return (
      <div className="text-red-500 mt-2">
        Error generating image: {error}
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center gap-2 text-gray-500 mt-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Generating image...
      </div>
    );
  }

  return (
    <div className="mt-2">
      <Image 
        src={imageUrl}
        alt={message.content}
        width={300}
        height={300}
        className="rounded-lg"
        unoptimized
      />
    </div>
  );
}
