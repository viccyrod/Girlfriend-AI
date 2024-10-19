import React from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AIModel } from '@/types/AIModel';
import CoverImage from '@/components/home-screen/CoverImage';

interface AIModelProfileProps {
  AIModel: AIModel;
  onClose: () => void;
}

const AIModelProfile: React.FC<AIModelProfileProps> = React.memo(({ AIModel, onClose }) => {
  const router = useRouter();

  const handleMessage = () => {
    router.push(`/chat?modelId=${AIModel.id}`);
  };

  return (
    <div className="flex flex-col">
      <CoverImage />
      <div className="flex flex-col p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <Avatar className="w-20 h-20 border-2 -mt-10">
            <AvatarImage 
              src={AIModel.imageUrl ?? ''} 
              className="object-cover" 
              alt={`${AIModel.name} avatar`} 
            />
            <AvatarFallback>{AIModel.name ? AIModel.name[0] : 'A'}</AvatarFallback>
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
              Back
            </Button>
          </div>
        </div>
        <div className="flex flex-col mt-4">
          <p className="text-lg font-semibold">{AIModel.name}</p>
          <p className="text-sm text-muted-foreground">
            Created by: {
              typeof AIModel.createdBy === 'object' && 'id' in AIModel.createdBy
                ? AIModel.createdBy.id === 'kp_e5590b8125e149b5825a3b83dcbe104d'
                  ? 'Dev 🚀'
                  : AIModel.createdBy.name.split(' ')[0]
                : AIModel.createdBy ?? 'Unknown'
            }
          </p>
          <p className="text-sm mt-2 md:text-md">
            {AIModel.personality ?? 'No personality information available.'}
          </p>
        </div>
      </div>
      <div aria-hidden="true" className="h-2 w-full bg-muted" />
    </div>
  );
});

AIModelProfile.displayName = 'AIModelProfile';

export default AIModelProfile;
