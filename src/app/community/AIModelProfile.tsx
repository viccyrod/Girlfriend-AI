import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AIModel } from '@/types/AIModel';
import CoverImage from '@/components/home-screen/CoverImage';

interface AIModelProfileProps {
  aIModel: AIModel;
  onClose: () => void;
}

const AIModelProfile: React.FC<AIModelProfileProps> = React.memo(({ aIModel, onClose }) => {
  const router = useRouter();

  const handleMessage = () => {
    router.push(`/chat?modelId=${aIModel.id}`);
  };

  return (
    <div className="flex flex-col">
      <CoverImage />
      <div className="flex flex-col p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <Avatar className="w-20 h-20 border-2 -mt-10">
            <AvatarImage 
              src={aIModel.imageUrl ?? ''} 
              className="object-cover" 
              alt={`${aIModel.name} avatar`} 
            />
            <AvatarFallback>{aIModel.name ? aIModel.name[0] : 'A'}</AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            <Button 
              className="rounded-full" 
              onClick={handleMessage}
              aria-label="Message AI Model"
            >
              Message
            </Button>
            <Button 
              className="rounded-full" 
              onClick={onClose} 
              variant="outline"
              aria-label="Close AI Model Profile"
            >
              Close
            </Button>
          </div>
        </div>
        <div className="flex flex-col mt-4">
          <p className="text-lg font-semibold">{aIModel.name}</p>
          <p className="text-sm text-muted-foreground">
            Created by: {aIModel.createdBy?.name ?? 'Unknown'}
          </p>
          <p className="text-sm mt-2 md:text-md">
            {aIModel.personality ?? 'No personality information available.'}
          </p>
        </div>
      </div>
      <div aria-hidden="true" className="h-2 w-full bg-muted" />
    </div>
  );
});

export default AIModelProfile;
