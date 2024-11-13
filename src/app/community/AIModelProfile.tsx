import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from '@/hooks/use-toast';
import { AiModel as AIModel } from "@/types/chat";
import { Heart, MessageCircle, User } from 'lucide-react';
// import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface AIModelProfileProps {
  aiModel: AIModel;
  // isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  isFollowing: boolean;
  onFollowToggle: () => Promise<boolean>;
  onStartChat: () => Promise<void>;
  // initialFollowState: boolean;
}

interface Creator {
  id: string;
  name: string;
}

const AIModelProfile: React.FC<AIModelProfileProps> = React.memo(({ 
  aiModel, 
  // isOpen, 
  // onClose, 
  // currentUserId,
  isFollowing,
  onFollowToggle,
  onStartChat
  // initialFollowState
}) => {
  const { toast } = useToast();
  const [isFollowingState, setIsFollowingState] = useState(isFollowing);
  const [aiModelState, setAiModelState] = useState(aiModel);

    if (!aiModelState) {
    return <div className="text-center py-8">No AI Model data available.</div>;
  }

  const handleMessage = async () => {
    try {
      await onStartChat();
    } catch (error) {
      console.error('Failed to handle message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFollow = async () => {
    try {
      const newFollowState = await onFollowToggle();
      setIsFollowingState(newFollowState);
      setAiModelState(prevModel => {
        if (!prevModel) return prevModel;
        return {
          ...prevModel,
          followerCount: newFollowState 
            ? (prevModel.followerCount || 0) + 1
            : Math.max((prevModel.followerCount || 0) - 1, 0)
        };
      });
    } catch (error) {
      console.error('Failed to toggle follow state', error);
    }
  };

  const getCreatorName = () => {
    if (typeof aiModelState.createdBy === 'object' && aiModelState.createdBy !== null) {
      const creator = aiModelState.createdBy as Creator;
      return creator.id === 'cm2jgzt3j0000w51m921l6af9'
        ? 'Dev 🚀'
        : creator.name.split(' ')[0];
    }
    return 'Dev 🚀';
  };

  return (
    <>
      <div className="w-full h-full overflow-auto bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="relative h-64 bg-gradient-to-r from-purple-500 to-pink-500">
          <div className="absolute top-4 right-4 flex items-center gap-4">
            {/* Commented out unused badges */}
            {/*
            <Badge variant="secondary" className="bg-white/20">
              <ImageIcon className="w-4 h-4 mr-1" />
              <span className="font-bold">45</span>
            </Badge>
            <Badge variant="secondary" className="bg-white/20">
              <VideoIcon className="w-4 h-4 mr-1" />
              <span className="font-bold">67</span>
            </Badge>
            */}
            <Badge variant="secondary" className="bg-white/20">
              <User className="w-4 h-4 mr-1" />
              <span className="font-bold">{aiModelState.followerCount || 0}</span>
            </Badge>
            {/* <Badge variant="secondary" className="bg-white/20">
              <Heart className="w-4 h-4 mr-1" />
              <span className="font-bold">10k</span>
            </Badge> */}
          </div>
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-gray-800">
              <AvatarImage 
                src={aiModelState.imageUrl || ''} 
                className="object-cover" 
                alt={`${aiModelState.name} avatar`} 
              />
              <AvatarFallback>{aiModelState.name ? aiModelState.name[0] : 'A'}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <div className="px-4 sm:px-8 pt-20 sm:pt-24 pb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1">{aiModelState.name}</h2>
          <p className="text-sm flex items-center mb-4 sm:mb-6">
            <User className="w-4 h-4 mr-1" /> Created by: {getCreatorName()}
          </p>
          <div className="flex space-x-4 mb-8">
            <Button 
              onClick={handleMessage} 
              variant="default" 
              className="flex items-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" /> Message
            </Button>
            <Button 
              variant={isFollowingState ? "secondary" : "outline"} 
              onClick={handleFollow} 
              className="flex items-center hover:bg-gray-700"
            >
              <Heart className={`w-4 h-4 mr-2 ${isFollowingState ? 'text-red-500 fill-current' : ''}`} /> 
              {isFollowingState ? 'Unfollow' : 'Follow'}
            </Button>
            {/* <Button variant="outline" className="flex items-center">
              <Bookmark className="w-4 h-4 mr-2" /> Save
            </Button>
            <Button variant="outline" className="flex items-center">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button> */}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <InfoCard title="Personality" content={aiModelState.personality || ''} />
            <InfoCard title="Appearance" content={aiModelState.appearance || ''} />
            <InfoCard title="Backstory" content={aiModelState.backstory || ''} />
            <InfoCard title="Hobbies" content={aiModelState.hobbies || ''} />
          </div>
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Likes & Dislikes</h3>
            <div className="flex flex-wrap gap-2">
              {aiModelState.likes.split(',').map((like, index) => (
                <Badge key={`like-${index}`} variant="secondary" className="bg-green-800 text-green-100">
                  {like.trim()}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {aiModelState.dislikes.split(',').map((dislike, index) => (
                <Badge key={`dislike-${index}`} variant="secondary" className="bg-red-800 text-red-100">
                  {dislike.trim()}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
});

AIModelProfile.displayName = 'AIModelProfile';

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
