"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
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
      <h1 className="flex justify-center text-3xl font-bold mb-8">AI Models</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aiModels?.map((aiModel) => (
          <Card key={aiModel.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{aiModel.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage 
                  src={aiModel.imageUrl || "/user-placeholder.png"}
                  alt={aiModel.name} 
                  className="object-cover"
                />
                <AvatarFallback>{aiModel.name.split(' ')[0][0]}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground mb-2">{aiModel.personality}</p>
              <p className="text-xs mb-4">
                Created by: {aiModel.createdBy.id === 'kp_e5590b8125e149b5825a3b83dcbe104d' ? 'Dev 🚀' : aiModel.createdBy.name.split(' ')[0]}
              </p>
              <Button onClick={() => handleViewProfile(aiModel.id)} className="w-full">
                View Profile
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
