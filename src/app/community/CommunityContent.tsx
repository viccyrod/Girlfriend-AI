"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader, Eye } from "lucide-react";
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
}

const fetchAIModels = async (): Promise<AIModel[]> => {
  const response = await fetch('/api/ai-models');
  if (!response.ok) {
    throw new Error('Failed to fetch AIModels');
  }
  return response.json();
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
      <div className="flex justify-center items-center h-full">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading AIModels. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Models</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiModels?.map((aiModel) => (
          <Card 
            key={aiModel.id} 
            className="flex flex-col hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1"
          >
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-center">{aiModel.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage 
                  src={aiModel.imageUrl || "/user-placeholder.png"}
                  alt={aiModel.name} 
                  className="object-cover"
                />
                <AvatarFallback>{aiModel.name.split(' ')[0][0]}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground mb-3 text-center leading-relaxed">
                {aiModel.personality}
              </p>
              <p className="text-xs mb-4 text-center">
                Created by: {aiModel.createdBy.id === 'kp_e5590b8125e149b5825a3b83dcbe104d' ? 'Dev 🚀' : aiModel.createdBy.name.split(' ')[0]}
              </p>
              <Button 
                onClick={() => handleViewProfile(aiModel.id)} 
                className="w-full mt-auto group relative overflow-hidden bg-primary hover:bg-primary-dark text-white transition-all duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
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