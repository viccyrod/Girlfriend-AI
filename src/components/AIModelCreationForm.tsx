'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useTokens } from '@/providers/TokensProvider';
import { TOKEN_COSTS } from '@/lib/constants';

interface AIModelCreationFormProps {
  user: User;
  setParentLoading: (loading: boolean) => void;
}

export function AIModelCreationForm({ user, setParentLoading }: AIModelCreationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { tokens, showNoTokensDialog } = useTokens();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    appearance: '',
    backstory: '',
    hobbies: '',
    likes: '',
    dislikes: '',
    isPrivate: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user has enough tokens
    if (tokens < TOKEN_COSTS.CHARACTER) {
      showNoTokensDialog();
      return;
    }

    setIsSubmitting(true);
    setParentLoading(true);

    try {
      const response = await fetch('/api/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details?.includes('max daily request limit exceeded')) {
          toast({
            title: 'Service Temporarily Unavailable',
            description: 'We\'ve reached our daily limit for AI model creation. Please try again tomorrow.',
            variant: 'destructive',
          });
          return;
        }
        throw new Error('Failed to create AI model');
      }

      const data = await response.json();
      router.push(`/community/AIModelProfile/${data.id}`);
    } catch (error) {
      console.error('Failed to create AI model:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create AI model. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
      setParentLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPrivate: checked }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="personality">Personality</Label>
          <Textarea
            id="personality"
            name="personality"
            value={formData.personality}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="appearance">Appearance</Label>
          <Textarea
            id="appearance"
            name="appearance"
            value={formData.appearance}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="backstory">Backstory</Label>
          <Textarea
            id="backstory"
            name="backstory"
            value={formData.backstory}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="hobbies">Hobbies</Label>
          <Input
            id="hobbies"
            name="hobbies"
            value={formData.hobbies}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="likes">Likes</Label>
          <Input
            id="likes"
            name="likes"
            value={formData.likes}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="dislikes">Dislikes</Label>
          <Input
            id="dislikes"
            name="dislikes"
            value={formData.dislikes}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPrivate"
            checked={formData.isPrivate}
            onCheckedChange={handleSwitchChange}
          />
          <Label htmlFor="isPrivate">Private Model</Label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
      >
        {isSubmitting ? 'Creating...' : 'Create AI Model'}
      </Button>
    </form>
  );
}
