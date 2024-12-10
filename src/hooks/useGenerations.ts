import { useState } from 'react';
import { toast } from 'sonner';

interface UseGenerationsProps {
  type: 'IMAGE' | 'PHOTO' | 'CHARACTER';
  onSuccess?: (result: any) => void;
}

export function useGenerations({ type, onSuccess }: UseGenerationsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const generate = async (prompt: string) => {
    setIsLoading(true);
    try {
      // First, generate the content based on type
      const generationResponse = await fetch(`/api/generate/${type.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!generationResponse.ok) {
        throw new Error('Generation failed');
      }

      const generationResult = await generationResponse.json();

      // Then, track the generation
      const trackingResponse = await fetch('/api/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          prompt,
          result: generationResult.url || generationResult.data,
          cost: generationResult.cost || 1,
        })
      });

      if (!trackingResponse.ok) {
        throw new Error('Failed to track generation');
      }

      const result = await trackingResponse.json();
      onSuccess?.(result);
      toast.success('Generation completed successfully!');
      return result;
    } catch (error) {
      toast.error('Generation failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generate,
    isLoading
  };
} 