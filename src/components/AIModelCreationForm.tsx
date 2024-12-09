'use client';

import { useState, useEffect } from 'react';
import { User } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Unlock } from 'lucide-react';

interface AIModelCreationFormProps {
  user: User;
  setParentLoading: (loading: boolean) => void;
}

export function AIModelCreationForm({ user, setParentLoading }: AIModelCreationFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    appearance: '',
    personality: '',
    backstory: '',
    hobbies: '',
    likes: '',
    dislikes: '',
    isPrivate: false
  });

  useEffect(() => {
    setParentLoading(isSubmitting);
  }, [isSubmitting, setParentLoading]);

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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <Label htmlFor="name" className="text-sm font-medium">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-12 rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 focus:ring-primary/20 placeholder:text-muted-foreground/50"
            placeholder="Enter their name..."
            required
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Label htmlFor="appearance" className="text-sm font-medium">Appearance</Label>
          <Textarea
            id="appearance"
            value={formData.appearance}
            onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
            className="min-h-[90px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
            placeholder="Describe their physical appearance..."
            required
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2 md:col-span-2"
        >
          <Label htmlFor="personality" className="text-sm font-medium">Personality</Label>
          <Textarea
            id="personality"
            value={formData.personality}
            onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
            className="min-h-[120px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
            placeholder="Describe their personality traits, behaviors, and characteristics..."
            required
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2 md:col-span-2"
        >
          <Label htmlFor="backstory" className="text-sm font-medium">Backstory</Label>
          <Textarea
            id="backstory"
            value={formData.backstory}
            onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
            className="min-h-[120px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
            placeholder="Share their background story, experiences, and memories..."
            required
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-2"
        >
          <Label htmlFor="hobbies" className="text-sm font-medium">Hobbies & Interests</Label>
          <Textarea
            id="hobbies"
            value={formData.hobbies}
            onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
            className="min-h-[90px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
            placeholder="What activities do they enjoy?"
            required
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-2"
        >
          <Label htmlFor="likes" className="text-sm font-medium">Likes</Label>
          <Textarea
            id="likes"
            value={formData.likes}
            onChange={(e) => setFormData({ ...formData, likes: e.target.value })}
            className="min-h-[90px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
            placeholder="What are their favorite things?"
            required
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-2"
        >
          <Label htmlFor="dislikes" className="text-sm font-medium">Dislikes</Label>
          <Textarea
            id="dislikes"
            value={formData.dislikes}
            onChange={(e) => setFormData({ ...formData, dislikes: e.target.value })}
            className="min-h-[90px] rounded-xl bg-background/50 border-primary/10 focus:border-primary/20 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
            placeholder="What things do they dislike?"
            required
          />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-between p-4 rounded-xl border border-primary/10 bg-primary/5"
        >
          <div className="flex items-center gap-3">
            {formData.isPrivate ? (
              <Lock className="w-4 h-4 text-primary" />
            ) : (
              <Unlock className="w-4 h-4 text-primary" />
            )}
            <div>
              <Label htmlFor="isPrivate" className="text-sm font-medium">Private Model</Label>
              <p className="text-xs text-muted-foreground">Only you can view and interact with private models</p>
            </div>
          </div>
          <Switch
            id="isPrivate"
            checked={formData.isPrivate}
            onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
            className="data-[state=checked]:bg-gradient-to-r from-pink-500 to-purple-500"
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-medium py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg hover:scale-[1.01]"
        >
          {isSubmitting ? 'Creating your companion...' : 'Create AI Companion'}
        </Button>
      </motion.div>
    </form>
  );
}
