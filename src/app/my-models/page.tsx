'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Users } from 'lucide-react';
import { AIModel } from '@/types/AIModel';
import { useToast } from '@/hooks/use-toast';
import BaseLayout from '@/components/BaseLayout';

export default function MyModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchMyModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-models/my-models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      setModels(data);
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to load your models. Please try again.',
        variant: 'destructive',
      });
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMyModels();
  }, [fetchMyModels]);

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="container mx-auto py-12 px-4">
          <h1 className="text-4xl font-bold mb-12 text-center text-primary">My AI Models</h1>
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
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <div className="container mx-auto py-12 px-4 h-full">
        <h1 className="text-4xl font-bold mb-12 text-center text-primary">My AI Models</h1>
        <div className="mb-8 text-center">
          <Button onClick={() => router.push('/community/create-ai-model')} className="bg-primary text-white">
            Create New AI Model
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {models.map((model) => (
            <Card 
              key={model.id} 
              className="flex flex-col hover:shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 bg-card"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-semibold text-center text-card-foreground">{model.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center pt-2">
                <Avatar className="w-32 h-32 mb-4 border-4 border-primary">
                  <AvatarImage 
                    src={model.imageUrl || "/user-placeholder.png"}
                    alt={model.name} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl font-bold text-primary bg-primary/10">
                    {model.name.split(' ')[0][0]}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-center mb-4 text-muted-foreground">{model.personality.substring(0, 100)}...</p>
                <div className="flex justify-between items-center w-full mt-auto">
                  <Button 
                    onClick={() => router.push(`/my-models/${model.id}`)}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <span className={`px-2 py-1 rounded-full text-xs ${model.isPrivate ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                    {model.isPrivate ? 'Private' : 'Public'}
                  </span>
                  <Button 
                    variant="ghost" 
                    className="flex items-center"
                    disabled
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {model.followerCount || 0}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </BaseLayout>
  );
}
