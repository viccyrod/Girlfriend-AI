'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  personality: z.string().min(10, 'Personality must be at least 10 characters'),
  appearance: z.string().min(10, 'Appearance must be at least 10 characters'),
  backstory: z.string().min(20, 'Backstory must be at least 20 characters'),
  hobbies: z.string().min(5, 'Hobbies must be at least 5 characters'),
  likes: z.string().min(5, 'Likes must be at least 5 characters'),
  dislikes: z.string().min(5, 'Dislikes must be at least 5 characters'),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AIModelCreationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create AI model');
      }

      const newAIModel = await response.json();
      toast({
        title: 'Success',
        description: `AI Model "${newAIModel.name}" created successfully!`,
      });
      window.location.href = `/community/AIModelProfile/${newAIModel.id}`;
    } catch (error) {
      console.error('Failed to create AI model:', error);
      toast({
        title: 'Error',
        description: 'Failed to create AI model. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create Your AI Model</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input {...register('name')} placeholder="Name" className="w-full" />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <Textarea {...register('personality')} placeholder="Personality" className="w-full h-24" />
            {errors.personality && <p className="text-red-500 text-sm mt-1">{errors.personality.message}</p>}
          </div>

          <div>
            <Textarea {...register('appearance')} placeholder="Appearance" className="w-full h-24" />
            {errors.appearance && <p className="text-red-500 text-sm mt-1">{errors.appearance.message}</p>}
          </div>

          <div>
            <Textarea {...register('backstory')} placeholder="Backstory" className="w-full h-24" />
            {errors.backstory && <p className="text-red-500 text-sm mt-1">{errors.backstory.message}</p>}
          </div>

          <div>
            <Input {...register('hobbies')} placeholder="Hobbies" className="w-full" />
            {errors.hobbies && <p className="text-red-500 text-sm mt-1">{errors.hobbies.message}</p>}
          </div>

          <div>
            <Input {...register('likes')} placeholder="Likes" className="w-full" />
            {errors.likes && <p className="text-red-500 text-sm mt-1">{errors.likes.message}</p>}
          </div>

          <div>
            <Input {...register('dislikes')} placeholder="Dislikes" className="w-full" />
            {errors.dislikes && <p className="text-red-500 text-sm mt-1">{errors.dislikes.message}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Create AI Model'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
