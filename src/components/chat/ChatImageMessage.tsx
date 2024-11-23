import { Message } from '@/types/message';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from 'next/image';

interface ChatImageMessageProps {
  message: Message;
}

export function ChatImageMessage({ message }: ChatImageMessageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get all images from the message metadata
  const images = message.metadata?.type === 'image' ? [
    message.metadata.imageUrl,
    ...(typeof message.metadata === 'string' ? [message.metadata] : [])
  ].filter((img): img is string => !!img) : [];

  if (!images.length) return null;

  return (
    <div className="relative group mt-2">
      <Dialog>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer group">
            <Image 
              src={images[currentImageIndex]} 
              alt="Generated"
              width={500}
              height={300}
              className="max-w-[300px] rounded-lg hover:opacity-95 transition-opacity"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"
            >
              <Expand className="h-4 w-4" />
            </Button>
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <Image 
            src={images[currentImageIndex]} 
            alt="Generated"
            width={500}
            height={300}
            className="w-full rounded-lg"
          />
          {message.metadata?.prompt && (
            <p className="text-sm text-muted-foreground mt-2">
              Prompt: {message.metadata.prompt}
            </p>
          )}
        </DialogContent>
      </Dialog>

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"
            onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50"
            onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="bg-black/60 text-white px-2 py-1 rounded-full text-xs">
              {currentImageIndex + 1} / {images.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
