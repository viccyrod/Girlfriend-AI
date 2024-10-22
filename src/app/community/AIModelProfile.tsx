import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AIModel } from '@/types/AIModel';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, User, ImageIcon, VideoIcon, Heart, Bookmark, Share2 } from 'lucide-react';

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
    <div className="w-full h-full overflow-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="absolute top-4 right-4 flex items-center gap-4">
          <Badge variant="secondary" className="bg-white/20">
            <ImageIcon className="w-4 h-4 mr-1" />
            <span className="font-bold">45</span>
          </Badge>
          <Badge variant="secondary" className="bg-white/20">
            <VideoIcon className="w-4 h-4 mr-1" />
            <span className="font-bold">67</span>
          </Badge>
          <Badge variant="secondary" className="bg-white/20">
            <Heart className="w-4 h-4 mr-1" />
            <span className="font-bold">10k</span>
          </Badge>
        </div>
        <div className="absolute bottom-0 left-8 transform translate-y-1/2">
          <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-gray-800">
            <AvatarImage 
              src={AIModel.imageUrl || ''} 
              className="object-cover" 
              alt={`${AIModel.name} avatar`} 
            />
            <AvatarFallback>{AIModel.name ? AIModel.name[0] : 'A'}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="px-4 sm:px-8 pt-20 sm:pt-24 pb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-1">{AIModel.name}</h2>
        <p className="text-sm flex items-center mb-4 sm:mb-6">
          <User className="w-4 h-4 mr-1" /> Created by: {getCreatorName()}
        </p>
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          <Button 
            onClick={handleMessage} 
            className="flex items-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg group"
          >
            <MessageCircle className="w-5 h-5 mr-2 transition-transform duration-300 ease-in-out group-hover:scale-110" />
            <span className="relative z-10">Message</span>
            <span className="absolute inset-0 h-full w-full bg-white rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 ease-in-out"></span>
          </Button>
          <Button 
            variant={isFollowing ? "secondary" : "outline"} 
            onClick={handleFollow} 
            className="flex items-center"
          >
            <Heart className="w-4 h-4 mr-2" /> {isFollowing ? 'Following' : 'Follow'}
          </Button>
          <Button variant="outline" className="flex items-center">
            <Bookmark className="w-4 h-4 mr-2" /> Save
          </Button>
          <Button variant="outline" className="flex items-center">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <InfoCard title="Personality" content={AIModel.personality} />
          <InfoCard title="Appearance" content={AIModel.appearance} />
          <InfoCard title="Backstory" content={AIModel.backstory} />
          <InfoCard title="Hobbies" content={AIModel.hobbies} />
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Likes & Dislikes</h3>
          <div className="flex flex-wrap gap-2">
            {AIModel.likes.split(',').map((like, index) => (
              <Badge key={`like-${index}`} variant="secondary" className="bg-green-800 text-green-100">
                {like.trim()}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {AIModel.dislikes.split(',').map((dislike, index) => (
              <Badge key={`dislike-${index}`} variant="secondary" className="bg-red-800 text-red-100">
                {dislike.trim()}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

interface InfoCardProps {
  title: string;
  content: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, content }) => (
  <Card className="bg-gray-800 border-gray-700">
    <CardContent className="p-4">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-gray-300">{content}</p>
    </CardContent>
  </Card>
);

export default AIModelProfile;
