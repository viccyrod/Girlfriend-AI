import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { AiModel } from '@/types/chat';

export interface ModelProfileProps {
  model: AiModel;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModelProfile({ model, open, onOpenChange }: ModelProfileProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#0f0f0f] border-white/5">
        <div className="relative aspect-square w-full mb-4 rounded-lg overflow-hidden">
          <Image
            src={model.imageUrl || '/placeholder.jpg'}
            alt={model.name}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
            priority
          />
        </div>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">{model.name}</h2>
              <p className="text-white/70">{model.age} years old</p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">Personality</h3>
              <p className="text-white/70">{model.personality}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">Appearance</h3>
              <p className="text-white/70">{model.appearance}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">Backstory</h3>
              <p className="text-white/70">{model.backstory}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-white mb-2">Likes</h3>
                <p className="text-white/70">{model.likes}</p>
              </div>
              <div>
                <h3 className="font-medium text-white mb-2">Dislikes</h3>
                <p className="text-white/70">{model.dislikes}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-white mb-2">Hobbies</h3>
              <p className="text-white/70">{model.hobbies}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}