'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface MagicAIModelCreationFormProps {
  user: User;
}

export function MagicAIModelCreationForm({ user }: MagicAIModelCreationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    prompt: '',
    isPrivate: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ai-models/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to create AI model');
      }

      const data = await response.json();
      toast({
        title: 'Success!',
        description: 'Your AI model has been created.',
      });
      router.push(`/community/AIModelProfile/${data.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create AI model. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}
