"use client";


import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
interface aIModel {
  id: string;
  name: string;
  personality: string;
  imageUrl: string;
  createdBy: {
    name: string
    id: string;
  };
}

const fetchaIModels = async (): Promise<aIModel[]> => {
  const response = await fetch('/api/ai-models');
  if (!response.ok) {
    throw new Error('Failed to fetch aIModels');
  }
  return response.json();
};

    export default function CommunityContent() {
    const router = useRouter();
    const { data: aIModels, isLoading, error } = useQuery<aIModel[]>({
    queryKey: ['aIModels'],
    queryFn: fetchaIModels,
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
    return <div>Error loading aIModels. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="flex justify-center text-3xl font-bold mb-8">AI Models</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aIModels?.map((aIModel) => (
          <Card key={aIModel.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{aIModel.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <Avatar className="w-32 h-32 mx-auto mb-4">
                <AvatarImage className="object-cover" src={aIModel.imageUrl} alt={aIModel.name} />
                <AvatarFallback>{aIModel.name[0]}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground mb-2">{aIModel.personality}</p>
              <p className="text-xs">
                Created by: {aIModel.createdBy.id === 'kp_e5590b8125e149b5825a3b83dcbe104d' ? 'Dev 🚀' : aIModel.createdBy.name.split(' ')[0]}
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleViewProfile(aIModel.id)}>View Profile</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
