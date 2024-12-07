import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from '@/hooks/use-toast';
import { AiModel as AIModel } from "@/types/chat";
import { Heart, MessageCircle, User, ImageIcon, X, Download, ExternalLink, Info } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AIModelProfileProps {
  aiModel: AIModel;
  onClose: () => void;
  currentUserId: string;
  isFollowing: boolean;
  onFollowToggle: () => Promise<boolean>;
  onStartChat: () => Promise<void>;
}

interface Creator {
  id: string;
  name: string;
}

interface Image {
  id: string;
  imageUrl: string;
  createdAt: Date;
  aiModelId: string;
}

const AIModelProfile: React.FC<AIModelProfileProps> = React.memo(({ 
  aiModel, 
  isFollowing,
  onFollowToggle,
  onStartChat
}) => {
  const { toast } = useToast();
  const [isFollowingState, setIsFollowingState] = useState(isFollowing);
  const [aiModelState, setAiModelState] = useState(aiModel);
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [activeTab, setActiveTab] = useState('feed');

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/ai-models/${aiModelState.id}/images`);
        if (!response.ok) throw new Error('Failed to fetch images');
        const data = await response.json();
        // Filter images for this specific model
        const filteredImages = data.filter((img: Image) => img.aiModelId === aiModelState.id);
        setImages(filteredImages);
      } catch (error) {
        console.error('Error fetching images:', error);
        toast({
          title: "Error",
          description: "Failed to load images. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (aiModelState?.id) {
      fetchImages();
    }
  }, [aiModelState?.id, toast]);

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${aiModelState.name}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Error",
        description: "Failed to download image. Please try again.",
        variant: "destructive",
      });
    }
  };

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
            <Badge variant="secondary" className="bg-white/20">
              <User className="w-4 h-4 mr-1" />
              <span className="font-bold">{aiModelState.followerCount || 0}</span>
            </Badge>
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
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-1">{aiModelState.name}</h2>
            <p className="text-sm flex items-center mb-4">
              <User className="w-4 h-4 mr-1" /> Created by: {getCreatorName()}
            </p>
            <div className="flex space-x-4">
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
            </div>
          </div>

          <Tabs defaultValue="feed" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="feed" className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800 rounded-xl overflow-hidden">
                      <div className="p-3 border-b border-gray-700 animate-pulse">
                        <div className="h-4 w-48 bg-gray-700 rounded" />
                      </div>
                      <div className="aspect-video bg-gray-700 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : images.length > 0 ? (
                <div className="space-y-6">
                  {images.map((image) => (
                    <div 
                      key={image.id}
                      className="bg-gray-800/50 rounded-xl overflow-hidden backdrop-blur-sm"
                    >
                      {/* Post Header */}
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage 
                              src={aiModelState.imageUrl || ''} 
                              className="object-cover" 
                              alt={aiModelState.name} 
                            />
                            <AvatarFallback>{aiModelState.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{aiModelState.name}</p>
                            <p className="text-sm text-gray-400">
                              {format(new Date(image.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Post Image */}
                      <div 
                        onClick={() => handleImageClick(image)}
                        className="cursor-pointer px-4 pb-4"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.imageUrl}
                          alt={`Generated by ${aiModelState.name}`}
                          className="w-full max-w-[600px] mx-auto rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-800/50 rounded-lg">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No images generated yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start a chat to generate images with {aiModelState.name}
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="about" className="mt-0">
              <div className="space-y-6">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 bg-gray-900 border-gray-800">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Image */}
            <div className="relative aspect-square sm:aspect-[4/3] md:aspect-[16/9] w-full overflow-hidden">
              {selectedImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedImage.imageUrl}
                  alt={`Generated by ${aiModelState.name}`}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Image info and actions */}
            {selectedImage && (
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">
                      Generated by {aiModelState.name}
                    </h3>
                    <p className="text-sm text-gray-300">
                      {format(new Date(selectedImage.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 backdrop-blur-sm"
                      onClick={() => handleDownload(selectedImage.imageUrl)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 backdrop-blur-sm"
                      onClick={() => window.open(selectedImage.imageUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Original
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
