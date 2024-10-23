"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface AIModel {
  id: string;
  name: string;
  personality: string;
  imageUrl: string;
  createdBy: {
    name: string;
    id: string;
  };
  followerCount: number;
}

const fetchAIModels = async (): Promise<AIModel[]> => {
  const response = await fetch('/api/ai-models');
  if (!response.ok) {
    throw new Error('Failed to fetch AIModels');
  }
  return await response.json();
};

export default function CommunityContent() {
  const router = useRouter();
  const { data: aiModels, isLoading, error } = useQuery<AIModel[]>({
    queryKey: ['aiModels'],
    queryFn: fetchAIModels,
  });

  const handleViewProfile = (id: string) => {
    router.push(`/community/AIModelProfile/${id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-12 text-center text-primary">Meet Your New Girlfriends</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="flex flex-col animate-pulse bg-card">
              <CardHeader className="pb-2">
                <div className="h-6 bg-muted rounded w-3/4 mx-auto"></div>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center pt-2">
                <div className="w-32 h-32 bg-muted rounded-full mb-4"></div>
                <div className="h-4 bg-muted rounded w-5/6 mb-2"></div>
                <div className="h-4 bg-muted rounded w-4/6 mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/6 mb-4"></div>
                <div className="w-full h-10 bg-muted rounded-md mt-auto"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500 text-xl">Error loading AI Models. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-12 text-center text-primary">Meet Your New Girlfriends</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {aiModels?.map((aiModel) => (
          <Card 
            key={aiModel.id} 
            className="flex flex-col hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-semibold text-center text-card-foreground">{aiModel.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center pt-2">
              <Avatar className="w-32 h-32 mb-4 border-4 border-primary">
                <AvatarImage 
                  src={aiModel.imageUrl || "/user-placeholder.png"}
                  alt={aiModel.name} 
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-bold text-primary bg-primary/10">
                  {aiModel.name.split(' ')[0][0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-card-foreground/80 mb-4 text-center leading-relaxed max-w-[250px]">
                {aiModel.personality}
              </p>
              <div className="flex items-center justify-center space-x-2 mb-6 bg-primary/10 px-3 py-1 rounded-full">
                <Users size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">
                  {aiModel.followerCount !== undefined ? (
                    <>
                      {aiModel.followerCount.toLocaleString()} {aiModel.followerCount === 1 ? 'Follower' : 'Followers'}
                    </>
                  ) : (
                    'No followers yet'
                  )}
                </span>
              </div>
              <Button 
                onClick={() => handleViewProfile(aiModel.id)} 
                className="w-full mt-auto group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
              >
                <span className="absolute right-0 top-0 h-full w-10 bg-white/20 transform -skew-x-12 transition-all duration-300 ease-in-out translate-x-full group-hover:translate-x-0"></span>
                <Eye className="w-5 h-5 mr-2 inline-block transition-transform duration-300 ease-in-out group-hover:scale-110" />
                <span className="relative z-10">View Profile</span>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}