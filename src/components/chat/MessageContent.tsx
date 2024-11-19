import Image from 'next/image';
import { Message } from '@/lib/ai-client';  

interface MessageContentProps {
  message: Message;
}

export function MessageContent({ message }: MessageContentProps) {
  // Check if message has image metadata
  const hasImage = message.metadata && 
    'type' in message.metadata && 
    message.metadata.type === 'image' &&
    'imageUrl' in message.metadata;

  return (
    <div className="flex flex-col gap-2">
      {/* Regular message content */}
      <div className="text-sm">{message.content}</div>
      
      {/* Image content if present */}
      {hasImage && (
        <div className="relative w-full max-w-md mt-2">
          <Image
            src={message.metadata?.imageUrl as string}
            alt={message.content}
            width={512}
            height={512}
            className="rounded-lg shadow-md"
            priority
          />
        </div>
      )}
    </div>
  );
} 