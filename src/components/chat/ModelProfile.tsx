import { Button } from '@/components/ui/button';
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ChevronRight, ChevronLeft, Phone, X } from 'lucide-react';
import Image from 'next/image';

interface ModelProfileProps {
  model: {
    id: string;
    name: string;
    imageUrl: string | null;
    personality?: string;
    userId: string;
    backstory?: string;
    hobbies?: string;
  } | null;
}

export default function ModelProfile({ 
  model, 
  onClose 
}: { 
  model: ModelProfileProps['model'];
  onClose?: () => void;
}) {
  if (!model) return null;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] relative">
      {/* Add close button for mobile */}
      <button
        onClick={onClose}
        className="md:hidden absolute right-4 top-4 p-2 bg-black/50 hover:bg-black/70 rounded-full z-50 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Large hero image section */}
      <div className="relative w-full h-[500px]">
        <Image
          src={model.imageUrl || ''}
          alt={model.name}
          width={500}
          height={500}
          className="w-full h-full object-cover"
        />
        {/* Image navigation buttons */}
        <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-2 rounded-full">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 p-2 rounded-full">
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Profile info section */}
      <div className="p-6 flex-1">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">{model.name}</h2>
          <p className="text-gray-400">{model.personality}</p>
        </div>

        <div className="space-y-4 text-sm">
          <p className="text-gray-400">{model.backstory}</p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {model.hobbies?.split(',').map((hobby, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-[#1a1a1a] text-gray-300 rounded-full text-sm"
              >
                {hobby.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Call to action button */}
      <div className="p-6 pt-0">
        <Button 
          className="w-full bg-green-500 hover:bg-green-600 text-white h-12 text-lg rounded-xl"
        >
          <Phone className="w-5 h-5 mr-2" />
          Call Me
        </Button>
      </div>
    </div>
  );
} 

