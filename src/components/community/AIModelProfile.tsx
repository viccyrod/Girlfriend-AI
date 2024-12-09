import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from '@/hooks/use-toast';
import { AiModel as AIModel } from "@/types/chat";
import { Heart, MessageCircle, User, ImageIcon, X, Download, ExternalLink, Info, Share2, Twitter, Facebook, Link } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

interface ImageWithLoadingState extends Image {
  isLoading?: boolean;
}

const AIModelProfile: React.FC<AIModelProfileProps> = React.memo(({ 
  aiModel, 
  onClose,
  currentUserId,
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
  const [showAllImages, setShowAllImages] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/ai-models/${aiModelState.id}/images`);
        if (!response.ok) throw new Error('Failed to fetch images');
        const data = await response.json();
        
        if (data.images && Array.isArray(data.images)) {
          setImages(data.images);
        } else {
          console.error('Unexpected image data structure:', data);
          setImages([]);
        }
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

  // Get displayed images based on showAllImages state
  const displayedImages = showAllImages ? images : images.slice(0, 3);
  const hasMoreImages = images.length > 3;

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

  const handleShare = async (platform: 'twitter' | 'facebook' | 'copy') => {
    const url = window.location.href;
    const text = `Check out ${aiModelState.name} on Girlfriend.cx - Your AI Companion for Meaningful Connections`;
    
    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "The profile link has been copied to your clipboard.",
          });
        } catch (err) {
          console.error('Failed to copy:', err);
          toast({
            title: "Failed to copy",
            description: "Please try again or copy the URL manually.",
            variant: "destructive",
          });
        }
        break;
    }
  };

  return (
    <>
      <div className="w-full h-full overflow-auto bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900 text-white">
        <div className="relative h-64 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 animate-gradient-x">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 backdrop-blur-sm"></div>
          <div className="absolute top-4 right-4 flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2">
              <User className="w-4 h-4 mr-2" />
              <span className="font-bold">{aiModelState.followerCount || 0} Followers</span>
            </Badge>
          </div>
          <div className="absolute bottom-0 left-8 transform translate-y-1/2">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
              <Avatar className="relative w-32 h-32 sm:w-40 sm:h-40 border-4 border-gray-900 group-hover:border-purple-500/50 transition-all duration-300">
                <AvatarImage 
                  src={aiModelState.imageUrl || ''} 
                  className="object-cover" 
                  alt={`${aiModelState.name} avatar`} 
                />
                <AvatarFallback>{aiModelState.name ? aiModelState.name[0] : 'A'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-8 pt-20 sm:pt-24 pb-6">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">{aiModelState.name}</h2>
            <p className="text-sm flex items-center mb-6 text-gray-300">
              <User className="w-4 h-4 mr-2" /> Created by: {getCreatorName()}
            </p>
            <div className="flex space-x-4">
              <Button 
                onClick={handleMessage} 
                variant="default" 
                className="relative group overflow-hidden bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <MessageCircle className="w-5 h-5 mr-2" /> Message
              </Button>
              <Button 
                variant={isFollowingState ? "secondary" : "outline"} 
                onClick={handleFollow} 
                className={`relative group overflow-hidden font-bold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-1 ${
                  isFollowingState 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-transparent border-2 border-purple-500 text-purple-500 hover:bg-purple-500/10'
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 transition-colors duration-300 ${isFollowingState ? 'text-red-500 fill-current' : ''}`} /> 
                {isFollowingState ? 'Following' : 'Follow'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="relative group overflow-hidden font-bold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-transparent border-2 border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900/95 backdrop-blur-xl border border-white/10">
                  <DropdownMenuItem 
                    onClick={() => handleShare('twitter')}
                    className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-purple-500/10 focus:bg-purple-500/10"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Share on Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleShare('facebook')}
                    className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-purple-500/10 focus:bg-purple-500/10"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Share on Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleShare('copy')}
                    className="flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-purple-500/10 focus:bg-purple-500/10"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="feed" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-800/50 backdrop-blur-md p-1 rounded-full">
              <TabsTrigger value="feed" className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500">
                <ImageIcon className="w-4 h-4 mr-2" />
                Feed
              </TabsTrigger>
              <TabsTrigger value="about" className="rounded-full data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500">
                <Info className="w-4 h-4 mr-2" />
                About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="mt-0">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800/30 rounded-xl overflow-hidden backdrop-blur-sm">
                      <div className="p-4 border-b border-gray-700/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700/50 animate-pulse" />
                          <div>
                            <div className="h-4 w-32 bg-gray-700/50 rounded animate-pulse mb-2" />
                            <div className="h-3 w-24 bg-gray-700/50 rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                      <div className="aspect-video bg-gray-700/50 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : displayedImages.length > 0 ? (
                <>
                  <div className="space-y-6">
                    {displayedImages.map((image) => (
                      <div 
                        key={image.id}
                        className="group bg-gray-800/40 hover:bg-gray-800/60 rounded-xl overflow-hidden backdrop-blur-md border border-white/5 transition-all duration-300"
                      >
                        <div className="px-4 py-3 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 ring-2 ring-purple-500/20">
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

                        <div 
                          onClick={() => handleImageClick(image)}
                          className="cursor-pointer p-4 transition-transform duration-300 group-hover:scale-[0.99]"
                        >
                          <div className="relative rounded-lg overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image.imageUrl}
                              alt={`Generated by ${aiModelState.name}`}
                              className="w-full max-w-[600px] mx-auto rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Show More Button */}
                  {hasMoreImages && !showAllImages && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={() => setShowAllImages(true)}
                        className="group relative px-6 py-2 rounded-full bg-gray-800/50 hover:bg-gray-800/70 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:-translate-y-1"
                      >
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 animate-pulse" />
                        <span className="relative flex items-center gap-2">
                          Show {images.length - 3} More Images
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </button>
                    </div>
                  )}
                </>
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
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoCard title="Personality" content={aiModelState.personality || ''} icon="👤" />
                  <InfoCard title="Appearance" content={aiModelState.appearance || ''} icon="✨" />
                  <InfoCard title="Backstory" content={aiModelState.backstory || ''} icon="📖" />
                  <InfoCard title="Hobbies" content={aiModelState.hobbies || ''} icon="🎨" />
                </div>
                <div className="space-y-4 bg-gray-800/40 backdrop-blur-md rounded-xl p-6 border border-white/5">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">Likes & Dislikes</h3>
                  <div className="flex flex-wrap gap-2">
                    {aiModelState.likes.split(',').map((like, index) => (
                      <Badge 
                        key={`like-${index}`} 
                        variant="secondary" 
                        className="bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors duration-300"
                      >
                        ❤️ {like.trim()}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {aiModelState.dislikes.split(',').map((dislike, index) => (
                      <Badge 
                        key={`dislike-${index}`} 
                        variant="secondary" 
                        className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors duration-300"
                      >
                        💔 {dislike.trim()}
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
        <DialogContent className="max-w-4xl w-[95vw] p-0 bg-gray-900/95 backdrop-blur-xl border border-white/10">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors border border-white/10"
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
              <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium text-lg">
                      Generated by {aiModelState.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {format(new Date(selectedImage.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all duration-300"
                      onClick={() => handleDownload(selectedImage.imageUrl)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all duration-300"
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
  icon: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, content, icon }) => (
  <Card className="group bg-gray-800/40 hover:bg-gray-800/60 border border-white/5 backdrop-blur-md transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h3 className="font-semibold text-lg bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">{title}</h3>
      </div>
      <p className="text-gray-300 leading-relaxed">{content}</p>
    </CardContent>
  </Card>
);

export default AIModelProfile; 