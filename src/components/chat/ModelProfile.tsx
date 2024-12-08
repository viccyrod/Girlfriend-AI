import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Phone, X, Users } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Profile header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a] border-b border-[#1a1a1a] p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">{model.name}</h2>
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-[#1a1a1a] rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{model.followerCount?.toLocaleString() || 0} followers</span>
          </div>
          <Button
            onClick={() => router.push(`/community/AIModelProfile/${model.id}`)}
            variant="secondary"
            size="sm"
            className="text-sm"
          >
            Go to Profile
          </Button>
        </div>
      </div>

      {/* Large hero image section */}
      <div className="relative w-full aspect-square">
        <Image
          src={model.imageUrl || ''}
          alt={model.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Profile info section */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <p className="text-gray-400">{model.personality}</p>
        </div>

        <div className="space-y-6 text-sm">
          {model.backstory && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Backstory</h3>
              <p className="text-gray-400">{model.backstory}</p>
            </div>
          )}
          
          {model.hobbies && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Hobbies</h3>
              <div className="flex flex-wrap gap-2">
                {model.hobbies.split(',').map((hobby, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-[#1a1a1a] text-gray-300 rounded-full text-sm"
                  >
                    {hobby.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call to action button */}
      <div className="p-6 pt-0 mt-auto border-t border-[#1a1a1a]">
        <div className="relative">
          <Button 
            className={cn(
              "w-full relative overflow-hidden h-12 text-lg",
              "bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500",
              "hover:from-pink-600 hover:via-rose-600 hover:to-pink-600",
              "text-white font-semibold",
              "transition-all duration-300 ease-out",
              "shadow-lg hover:shadow-xl",
              "border-0 rounded-xl"
            )}
            disabled
          >
            <Phone className="w-5 h-5 mr-2" />
            Call Me
            <div className="absolute top-0 right-0 px-2 py-1 translate-x-2 -translate-y-2">
              <div className="relative">
                <span className="absolute inset-0 bg-black/20 blur-sm rounded-full" />
                <span className="relative bg-black/40 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                  Coming Soon
                </span>
              </div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
} 

