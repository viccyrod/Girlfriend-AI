'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AIModelCustomization } from '@/components/AIModelCustomization';
import { AIModel } from '@/types/AIModel';
import { useToast } from '@/hooks/use-toast';
import BaseLayout from '@/components/BaseLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Heart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export default function EditAIModelPage({ params }: { params: { id: string } }) {
  const [model, setModel] = useState<AIModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const fetchModel = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/ai-models/${params.id}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch model: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched model data:', data);
      setModel(data);
    } catch (error) {
      console.error('Error in fetchModel:', error);
      toast({
        title: 'Error',
        description: 'Failed to load the AI model. Please try again.',
        variant: 'destructive',
      });
      router.push('/my-models');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, toast, router]);

  useEffect(() => {
    fetchModel();
  }, [params.id, fetchModel]);


  const handleSave = (updatedModel: AIModel) => {
    setModel(updatedModel);
    toast({
      title: 'Success',
      description: 'AI Model updated successfully!',
    });
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/ai-models/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete model');

      toast({
        title: 'Success',
        description: 'AI Model deleted successfully.',
      });
      router.push('/my-models');
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: 'Failed to delete AI model. Please try again.',
        variant: 'destructive',
      });
      console.error('Error deleting AI model:', error);
    }
  };

  console.log('Rendering EditAIModelPage, params:', params);
  console.log('isLoading:', isLoading);
  console.log('model:', model);

  if (isLoading) {
    return (
      <BaseLayout>
        <div className="container mx-auto py-12 px-4">
          <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-3xl font-bold text-center">Loading AI Model...</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </BaseLayout>
    );
  }

  console.log('About to render model:', model);

  if (!model) {
    console.log('Model is null, rendering null');
    return null;
  }

  return (
    <BaseLayout>
      <div className="container mx-auto py-12 px-4">
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold text-center">Edit AI Model: {model.name}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start mb-8">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary mb-4 md:mb-0 md:mr-8">
                <AvatarImage src={model.imageUrl || ''} alt={model.name} className="object-cover" />
                <AvatarFallback>{model.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2">{model.name}</h2>
                <p className="text-muted-foreground mb-4">{model.personality.substring(0, 150)}...</p>
                <div className="flex items-center space-x-4 mb-4">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{model.followerCount || 0} Followers</span>
                  </Badge>
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{model.isPrivate ? 'Private' : 'Public'}</span>
                  </Badge>
                </div>
              </div>
            </div>
            <AIModelCustomization aiModel={model} onSave={handleSave} />
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h3>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete AI Model
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your AI model
                      and remove all of its data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <p className="text-sm text-gray-500 mb-2">
                      To confirm, type &quot;{model.name}&quot; in the box below:
                    </p>
                    <Input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={model.name}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deleteConfirmation !== model.name}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  );
}
