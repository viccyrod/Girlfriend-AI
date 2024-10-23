'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type FormData = z.infer<typeof formSchema>;

export function MagicAIModelCreationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Here, you would call an API endpoint that uses ChatGPT to generate the AI model details
      const response = await fetch('/api/ai-models/magic', {
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
      // Redirect to the new AI model's page
      window.location.href = `/community/AIModelProfile/${newAIModel.id}`;
    } catch (error) {
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
        <CardTitle className="text-2xl font-bold text-center">Magic AI Model Creation</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Textarea 
              {...register('description')} 
              placeholder="Describe your AI model in natural language..." 
              className="w-full h-48"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Creating...' : 'Generate AI Model'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
