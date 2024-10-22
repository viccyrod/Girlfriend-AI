import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AIModel } from '@/types/AIModel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, User, ImageIcon, VideoIcon } from 'lucide-react';

interface AIModelProfileProps {
  AIModel: AIModel | null;
  onClose: () => void;
}

const AIModelProfile: React.FC<AIModelProfileProps> = React.memo(({ AIModel, onClose }) => {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);

  if (!AIModel) {
    return <div className="text-center py-8">No AI Model data available.</div>;
  }

  const handleMessage = () => {
    router.push(`/chat?modelId=${AIModel.id}`);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const getCreatorName = () => {
    if (typeof AIModel.createdBy === 'object' && AIModel.createdBy !== null) {
      if ('id' in AIModel.createdBy && 'name' in AIModel.createdBy) {
        return AIModel.createdBy.id === 'cm2jgzt3j0000w51m921l6af9'
          ? 'Dev 🚀'
          : AIModel.createdBy.name.split(' ')[0];
      }
    }
    return 'Dev 🚀';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-2xl mx-auto overflow-hidden">
        <div className="relative h-48 sm:h-64 bg-gradient-to-r from-purple-500 to-pink-500">
          <Avatar className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 border-4 border-white">
            <AvatarImage 
              src={AIModel.imageUrl || ''} 
              className="object-cover" 
              alt={`${AIModel.name} avatar`} 
            />
            <AvatarFallback>{AIModel.name ? AIModel.name[0] : 'A'}</AvatarFallback>
          </Avatar>
          <div className="absolute top-0 left-0 w-full p-4">
            <div className="flex justify-between items-center text-white">
              <div className="flex flex-col">
                <p className="font-bold text-lg sm:text-xl">{AIModel.name}</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" />
                    <span className="font-bold">45</span>
                  </div>
                  <span className="text-xs">•</span>
                  <div className="flex items-center gap-1">
                    <VideoIcon className="w-4 h-4" />
                    <span className="font-bold">67</span>
                  </div>
                  <span className="text-xs">•</span>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span className="font-bold">10k</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="pt-20 pb-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">{AIModel.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center justify-center">
              <User className="w-4 h-4 mr-1" /> Created by: {getCreatorName()}
            </p>
          </div>
          <div className="flex justify-center space-x-4 mb-6">
            <Button onClick={handleMessage} className="flex items-center">
              <MessageCircle className="w-4 h-4 mr-2" /> Message
            </Button>
            <Button 
              variant={isFollowing ? "default" : "outline"} 
              onClick={handleFollow} 
              className="flex items-center"
            >
              <Heart className="w-4 h-4 mr-2" /> {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <InfoCard title="Personality" content={AIModel.personality} />
            <InfoCard title="Appearance" content={AIModel.appearance} />
            <InfoCard title="Backstory" content={AIModel.backstory} />
            <InfoCard title="Hobbies" content={AIModel.hobbies} />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {AIModel.likes.split(',').map((like, index) => (
              <Badge key={index} variant="secondary">{like.trim()}</Badge>
            ))}
          </div>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Close
          </button>
        </CardContent>
      </Card>
    </div>
  );
});

const InfoCard: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="bg-muted p-4 rounded-lg">
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-sm">{content}</p>
  </div>
);

AIModelProfile.displayName = 'AIModelProfile';

export default AIModelProfile;
