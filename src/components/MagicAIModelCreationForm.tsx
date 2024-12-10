'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

const creationPhrases = [
  "Initializing quantum personality matrix... 🧬",
  "Generating ultra-high definition images using GPU clusters... 🖼️",
  "Synthesizing emotional response patterns... 💝",
  "Calibrating conversation dynamics... 💭",
  "Infusing with unique character traits... ✨",
  "Optimizing neural pathways... 🧠",
  "Adding sprinkles of charm and wit... ⭐",
  "Performing final personality alignment... 🎯"
];

const CreationAnimation = () => {
  const [currentPhrase, setCurrentPhrase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % creationPhrases.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return createPortal(
    <div className="fixed inset-0 bg-[#0a0a0a]/90 backdrop-blur-md z-[9999] flex items-center justify-center">
      <div className="max-w-md w-full p-8">
        <div className="flex flex-col items-center space-y-8">
          {/* Pulsing Heart Animation */}
          <div className="relative w-32 h-32 animate-pulse">
            <svg
              className="w-full h-full text-pink-500"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {/* Ripple Effect */}
            <div className="absolute inset-0 animate-ping">
              <svg
                className="w-full h-full text-pink-500 opacity-75"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center space-y-6">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Creating Your AI Companion
            </h3>
            <p className="text-lg text-muted-foreground animate-fade-in">
              {creationPhrases[currentPhrase]}
            </p>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                style={{ 
                  width: `${((currentPhrase + 1) / creationPhrases.length) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

interface MagicAIModelCreationFormProps {
  user: User;
  setParentLoading: (loading: boolean) => void;
}

const INITIAL_POLLING_INTERVAL = 2000; // 2 seconds
const MAX_POLLING_INTERVAL = 10000; // 10 seconds
const MAX_POLLING_DURATION = 180000; // 3 minutes

export function MagicAIModelCreationForm({ user, setParentLoading }: MagicAIModelCreationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    isPrivate: false
  });

  useEffect(() => {
    setParentLoading(isSubmitting);
  }, [isSubmitting, setParentLoading]);

  const pollModelStatus = async (id: string, startTime: number, interval: number = INITIAL_POLLING_INTERVAL) => {
    const currentTime = Date.now();
    if (currentTime - startTime > MAX_POLLING_DURATION) {
      throw new Error('Model generation is taking longer than expected. Please check your profile page later to see if it completed.');
    }

    try {
      const statusResponse = await fetch(`/api/ai-models/${id}/status`);
      if (!statusResponse.ok) {
        throw new Error('Failed to check model status');
      }

      const { status } = await statusResponse.json();
      
      if (status === 'COMPLETED') {
        setIsSubmitting(false);
        router.push(`/community/AIModelProfile/${id}`);
        return true;
      } 
      
      if (status === 'FAILED') {
        throw new Error('Model generation failed. Please try again.');
      }

      // Show longer wait message after 30 seconds
      if (currentTime - startTime > 30000) {
        toast({
          title: 'Still working...',
          description: 'This is taking longer than usual, but we\'re still processing your request.',
        });
      }

      return false;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ai-models/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPrompt: formData.prompt,
          isPrivate: formData.isPrivate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create AI model');
      }

      const { id } = await response.json();
      
      // Start polling with interval
      const startTime = Date.now();
      const pollInterval = setInterval(async () => {
        try {
          const isComplete = await pollModelStatus(id, startTime);
          if (isComplete) {
            clearInterval(pollInterval);
          }
        } catch (error) {
          clearInterval(pollInterval);
          setIsSubmitting(false);
          toast({
            title: 'Error',
            description: error instanceof Error ? error.message : 'Failed to check model status',
            variant: 'destructive'
          });
        }
      }, INITIAL_POLLING_INTERVAL);

      // Cleanup interval on unmount
      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error('Creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create AI model. Please try again.',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting && <CreationAnimation />}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
        <div>
          <Label htmlFor="prompt">Describe Your Dream AI Companion</Label>
          <Textarea
            id="prompt"
            value={formData.prompt}
            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
            placeholder="Describe your ideal AI companion in detail. Include personality traits, appearance, interests, and any other important characteristics."
            className="h-48"
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPrivate"
            checked={formData.isPrivate}
            onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
          />
          <Label htmlFor="isPrivate">Private Model</Label>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Magic...
            </>
          ) : (
            'Create with Magic'
          )}
        </Button>

        <p className="text-sm text-muted-foreground text-center">
          Our AI will help create a detailed profile based on your description.
        </p>
      </form>
    </>
  );
}
