'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const formSchema = z.object({
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

type FormData = z.infer<typeof formSchema>;

export function MagicAIModelCreationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setStatus('Creating your AI model...');
    try {
      const response = await fetch('/api/ai-models/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customPrompt: `Create an AI girlfriend with the following description: ${data.description}` 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to create AI model');
      }

      const newAIModel = await response.json();
      console.log('Created AI model:', newAIModel);
      
      if (newAIModel.imageUrl) {
        setGeneratedImage(newAIModel.imageUrl);
      }
      
      toast({
        title: 'Success',
        description: `AI Model "${newAIModel.name}" created successfully!`,
      });
      
      router.push(`/community/AIModelProfile/${newAIModel.id}`);
    } catch (error) {
      console.error('Error in magic AI creation:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create AI model. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setStatus('');
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
              placeholder="Describe your dream AI companion in detail... The more specific you are, the better the result!" 
              className="w-full h-48"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          {generatedImage && (
            <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-4">
              <Image
                src={generatedImage}
                alt="Generated AI Model"
                fill
                className="object-cover"
              />
            </div>
          )}

          {status && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>{status}</p>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating your AI...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Create Magic AI Model
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
