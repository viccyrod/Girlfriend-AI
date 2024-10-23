import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { AIModel } from '@/types/AIModel';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  personality: z.string().min(10, 'Personality must be at least 10 characters'),
  appearance: z.string().min(10, 'Appearance must be at least 10 characters'),
  backstory: z.string().min(20, 'Backstory must be at least 20 characters'),
  hobbies: z.string().min(5, 'Hobbies must be at least 5 characters'),
  likes: z.string().min(5, 'Likes must be at least 5 characters'),
  dislikes: z.string().min(5, 'Dislikes must be at least 5 characters'),
  isPrivate: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface AIModelCustomizationProps {
  aiModel: AIModel;
  onSave: (updatedModel: AIModel) => void;
}

export function AIModelCustomization({ aiModel, onSave }: AIModelCustomizationProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: aiModel,
  });
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch(`/api/ai-models/${aiModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update AI model');

      const updatedModel = await response.json();
      onSave(updatedModel);
      toast({
        title: 'Success',
        description: 'AI Model updated successfully!',
      });
    } catch (error) {
      console.error('Failed to update AI model:', error);
      toast({
        title: 'Error',
        description: 'Failed to update AI model. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input {...register('name')} placeholder="Name" />
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}

      <Textarea {...register('personality')} placeholder="Personality" />
      {errors.personality && <p className="text-red-500">{errors.personality.message}</p>}

      <Textarea {...register('appearance')} placeholder="Appearance" />
      {errors.appearance && <p className="text-red-500">{errors.appearance.message}</p>}

      <Textarea {...register('backstory')} placeholder="Backstory" />
      {errors.backstory && <p className="text-red-500">{errors.backstory.message}</p>}

      <Input {...register('hobbies')} placeholder="Hobbies" />
      {errors.hobbies && <p className="text-red-500">{errors.hobbies.message}</p>}

      <Input {...register('likes')} placeholder="Likes" />
      {errors.likes && <p className="text-red-500">{errors.likes.message}</p>}

      <Input {...register('dislikes')} placeholder="Dislikes" />
      {errors.dislikes && <p className="text-red-500">{errors.dislikes.message}</p>}

      <div className="flex items-center space-x-2">
        <Switch {...register('isPrivate')} id="isPrivate" />
        <label htmlFor="isPrivate">Private Model</label>
      </div>

      <Button type="submit">Save Changes</Button>
    </form>
  );
}
