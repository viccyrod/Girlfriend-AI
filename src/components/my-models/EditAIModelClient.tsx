'use client';

import { AIModelCustomization } from '@/components/AIModelCustomization';
import BaseLayout from '@/components/BaseLayout';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Heart, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { User as PrismaUser, AIModel } from '@prisma/client';

interface EditAIModelClientProps {
  user: PrismaUser;
  initialModel: AIModel & {
    createdBy: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    } | null;
    followers: any[];
  };
}

export default function EditAIModelClient({ user, initialModel }: EditAIModelClientProps) {
  const transformedModel = {
    ...initialModel,
    isFollowing: false,
    createdBy: initialModel.createdBy ? {
      id: initialModel.createdBy.id,
      name: initialModel.createdBy.name,
      email: initialModel.createdBy.email,
      imageUrl: initialModel.createdBy.image
    } : null
  };

  const [model, setModel] = useState(transformedModel);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const handleSave = async (updatedModel: any) => {
    try {
      const response = await fetch(`/api/ai-models/${model.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updatedModel, status: model.status }),
      });

      if (!response.ok) throw new Error('Failed to update model');

      setModel({ ...model, ...updatedModel });
      toast({
        title: 'Success',
        description: 'AI Model updated successfully!',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update AI model. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/ai-models/${model.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete model');

      toast({
        title: 'Success',
        description: 'AI Model deleted successfully.',
      });
      router.push('/my-models');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete AI model. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <BaseLayout>
      <div className="container mx-auto py-12 px-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/my-models')}
          className="mb-4 flex items-center text-primary hover:text-primary-dark"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Models
        </Button>
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
                {model.personality && (
                  <p className="text-muted-foreground mb-4">
                    {model.personality.substring(0, 150)}...
                  </p>
                )}
                <div className="flex items-center space-x-4 mb-4">
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <User className="w-4 h-4" />
                    <span>{model.followers?.length || 0} Followers</span>
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