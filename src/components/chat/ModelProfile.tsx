import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";
import { ChevronRight, Heart, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ModelProfileProps {
  model: {
    id: string;
    name: string;
    imageUrl: string | null;
    personality?: string;
    userId: string;
    backstory?: string;
    hobbies?: string;
    followerCount?: number;
  } | null;
  onClose?: () => void;
}

export default function ModelProfile({ 
  model, 
  onClose 
}: ModelProfileProps) {
  const router = useRouter();
  
  if (!model) return null;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]/95 backdrop-blur-sm">
      {/* Profile header with gradient */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0a0a0a] to-transparent">
        <div className="p-6 space-y-6">
          {/* Avatar and basic info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 ring-2 ring-purple-500/20">
                <AvatarImage src={model.imageUrl || ''} alt={model.name} />
                <AvatarFallback>{model.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
                  {model.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <Users className="w-4 h-4" />
                  <span>{model.followerCount?.toLocaleString() || 0} followers</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* View full profile button */}
          <Button
            onClick={() => router.push(`/community/AIModelProfile/${model.id}`)}
            variant="secondary"
            className="w-full bg-white/5 hover:bg-white/10 text-white"
          >
            View Full Profile
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Profile content */}
      <div className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto">
        {/* About section */}
        {model.personality && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400">About</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {model.personality}
            </p>
          </div>
        )}

        {/* Backstory section */}
        {model.backstory && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400">Backstory</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {model.backstory}
            </p>
          </div>
        )}

        {/* Hobbies section */}
        {model.hobbies && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400">Hobbies</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {model.hobbies}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 

