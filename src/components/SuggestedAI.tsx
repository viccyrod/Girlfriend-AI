import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface AIModel {
  id: string;
  name: string;
  image?: string;
  description: string;
}

const SuggestedAI: React.FC<{ ai: AIModel }> = ({ ai }) => {
  return (
    <div>
      <div key={ai.id} className="flex items-center gap-2 mb-4">
        <Avatar>
          <AvatarImage className='w-10 h-10' src={ai.image || "/ai-placeholder.png"} alt={ai.name} />
          <AvatarFallback>{ai.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{ai.name}</span>
          <span className="text-xs text-zinc-400">{ai.description}</span>
        </div>
      </div>
    </div>
  );
};

export default SuggestedAI;
