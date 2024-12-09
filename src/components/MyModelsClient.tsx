'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User } from '@prisma/client';
import { Eye, Trash2, Users, Plus, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { AIModelResponse } from '@/types/ai-model';
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

interface MyModelsClientProps {
  user: User;
}

const DEFAULT_IMAGE_URL = '/user-placeholder.png';

export default function MyModelsClient({ user }: MyModelsClientProps) {
  const [models, setModels] = useState<AIModelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async (modelId: string) => {
    try {
      const response = await fetch(`/api/ai-models/${modelId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete model');
      
      toast({
        title: 'Success',
        description: 'AI Model deleted successfully',
      });
      
      fetchMyModels();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete the model. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const fetchMyModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('/api/ai-models/my-models', {
        signal: controller.signal,
        next: { revalidate: 30 }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch models');
      }
      const data = await response.json();
      setModels(data);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load your models. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMyModels();
    return () => {
      // Cleanup any pending requests
      setModels([]);
      setIsLoading(false);
      setError(null);
    };
  }, [fetchMyModels]);

  const PageHeader = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <h2 className="text-3xl font-bold">
        My{' '}
        <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-transparent bg-clip-text">
          AI Companions
        </span>
      </h2>
      <Button 
        onClick={() => router.push('/community/create-ai-model')}
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition-all duration-300 w-full sm:w-auto"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create New Model
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <PageHeader />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div 
              key={index} 
              className="relative aspect-[3/4] rounded-xl overflow-hidden border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-600/5"
            >
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-pink-500/10 to-purple-600/10" />
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
                <div className="h-6 bg-white/10 rounded animate-pulse" />
                <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse" />
                <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <PageHeader />
        <div className="flex flex-col items-center justify-center text-center p-8 rounded-xl border border-red-500/20 bg-red-500/5">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error Loading Models</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button 
            onClick={fetchMyModels}
            className="bg-red-500 hover:bg-red-600 transition-colors"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <PageHeader />
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-600/5">
          <div className="w-16 h-16 mb-6 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-600/20 flex items-center justify-center animate-pulse">
            <PlusCircle className="w-8 h-8 text-pink-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No AI Companions Yet</h3>
          <p className="text-gray-400 mb-6 max-w-md">
            Create your first AI companion to get started. You can customize their personality, appearance, and more!
          </p>
          <Button 
            onClick={() => router.push('/community/create-ai-model')}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First AI Companion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <PageHeader />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {models.map((model, index) => (
          <div 
            key={model.id} 
            className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-purple-600/5 hover:border-pink-500/40 transition-all duration-300"
          >
            <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8 rounded-full bg-black/50 border-pink-500/20 hover:bg-pink-500/20 backdrop-blur-sm transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/my-models/${model.id}`);
                }}
              >
                <Eye className="w-4 h-4 text-white" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-8 h-8 rounded-full bg-black/50 border-pink-500/20 hover:bg-red-500/20 backdrop-blur-sm transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {model.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your AI companion and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(model.id)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="relative w-full h-full">
              <Image
                src={model.imageUrl || DEFAULT_IMAGE_URL}
                alt={model.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src !== DEFAULT_IMAGE_URL) {
                    img.src = DEFAULT_IMAGE_URL;
                  }
                }}
                priority={index < 4}
                loading={index < 4 ? 'eager' : 'lazy'}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-pink-500 transition-colors duration-300">
                    {model.name}
                  </h3>
                  <span className={`text-sm ${model.isPrivate ? 'text-red-400' : 'text-green-400'}`}>
                    {model.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-gradient-to-r from-pink-500/20 to-purple-600/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Users size={14} className="text-pink-500" />
                  <span className="text-sm text-white font-medium">
                    {model.followerCount?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                {model.personality}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 