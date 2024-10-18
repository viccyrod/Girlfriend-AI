import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AIModel } from '@/types/AIModel';
import CoverImage from '@/components/home-screen/CoverImage';

interface AIModelProfileProps {
  aIModel: AIModel;
  onClose: () => void;
}

const AIModelProfile: React.FC<AIModelProfileProps> = React.memo(({ aIModel, onClose }) => {
  return (
    <div className="flex flex-col">
      {/* Cover Image Section */}
      <CoverImage />

      {/* Profile Content */}
      <div className="flex flex-col p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Avatar Section */}
          <Avatar className="w-20 h-20 border-2 -mt-10">
            <AvatarImage 
              src={aIModel.imageUrl ?? ''} 
              className="object-cover" 
              alt={`${aIModel.name} avatar`} 
            />
            <AvatarFallback>{aIModel.name ? aIModel.name[0] : 'A'}</AvatarFallback>
          </Avatar>

          {/* Close Button */}
          <div className="flex">
            <Button 
              className="rounded-full flex gap-10" 
              onClick={onClose} 
              aria-label="Close AI Model Profile"
            >
              <span className="uppercase font-semibold tracking-wide">Close</span>
            </Button>
          </div>
        </div>

        {/* Model Information */}
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

      {/* Divider */}
      <div aria-hidden="true" className="h-2 w-full bg-muted" />
    </div>
  );
});

export default AIModelProfile;
