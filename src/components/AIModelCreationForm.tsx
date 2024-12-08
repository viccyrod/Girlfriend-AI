'use client';

import { useState } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AIModelCreationFormProps {
  user: User;
}

export function AIModelCreationForm({ user }: AIModelCreationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
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
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/ai-models', {
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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="personality">Personality</Label>
        <Textarea
          id="personality"
          value={formData.personality}
          onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="appearance">Appearance</Label>
        <Textarea
          id="appearance"
          value={formData.appearance}
          onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="backstory">Backstory</Label>
        <Textarea
          id="backstory"
          value={formData.backstory}
          onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="hobbies">Hobbies</Label>
        <Textarea
          id="hobbies"
          value={formData.hobbies}
          onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="likes">Likes</Label>
        <Textarea
          id="likes"
          value={formData.likes}
          onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="dislikes">Dislikes</Label>
        <Textarea
          id="dislikes"
          value={formData.dislikes}
          onChange={(e) => setFormData({ ...formData, dislikes: e.target.value })}
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
        {isSubmitting ? 'Creating...' : 'Create AI Model'}
      </Button>
    </form>
  );
}
