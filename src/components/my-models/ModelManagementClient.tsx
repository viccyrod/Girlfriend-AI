'use client';

import { useState } from 'react';
import { User, AIModel } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Trash, Twitter, Instagram } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ModelManagementClientProps {
  model: AIModel & {
    _count: {
      followers: number;
    };
  };
  user: User;
}

const DEFAULT_IMAGE_URL = '/user-placeholder.png';

export default function ModelManagementClient({ model, user }: ModelManagementClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: model.name,
    personality: model.personality || '',
    appearance: model.appearance || '',
    backstory: model.backstory || '',
    hobbies: model.hobbies || '',
    likes: model.likes || '',
    dislikes: model.dislikes || '',
    isPrivate: model.isPrivate,
    imageUrl: model.imageUrl || DEFAULT_IMAGE_URL
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-models/' + model.id, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update model');

      toast({
        title: 'Success',
        description: 'Model updated successfully',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update model. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this AI Model? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai-models/' + model.id, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete model');

      toast({
        title: 'Success',
        description: 'Model deleted successfully',
      });

      router.push('/my-models');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete model. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <Link 
            href="/my-models" 
            className="inline-flex items-center text-sm text-purple-500 hover:text-purple-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to My Models
          </Link>
          <h1 className="text-2xl font-bold mb-4">Edit AI Model: {model.name}</h1>
        </div>

        {/* Model Card */}
        <div className="bg-[#0A0A0A] rounded-lg p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={formData.imageUrl}
                alt={formData.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (img.src !== DEFAULT_IMAGE_URL) {
                    img.src = DEFAULT_IMAGE_URL;
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold mb-2">{formData.name}</h2>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {formData.personality}
              </p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <span>{model._count.followers}</span>
                  <span>Followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs ${formData.isPrivate ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                    {formData.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-[#0A0A0A] border-gray-800 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Personality</label>
            <Textarea
              value={formData.personality}
              onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
              className="bg-[#0A0A0A] border-gray-800 focus:border-purple-500 min-h-[150px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Appearance</label>
            <Textarea
              value={formData.appearance}
              onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
              className="bg-[#0A0A0A] border-gray-800 focus:border-purple-500 min-h-[150px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Backstory</label>
            <Textarea
              value={formData.backstory}
              onChange={(e) => setFormData(prev => ({ ...prev, backstory: e.target.value }))}
              className="bg-[#0A0A0A] border-gray-800 focus:border-purple-500 min-h-[150px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Hobbies</label>
            <Textarea
              value={formData.hobbies}
              onChange={(e) => setFormData(prev => ({ ...prev, hobbies: e.target.value }))}
              className="bg-[#0A0A0A] border-gray-800 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Likes</label>
            <Textarea
              value={formData.likes}
              onChange={(e) => setFormData(prev => ({ ...prev, likes: e.target.value }))}
              className="bg-[#0A0A0A] border-gray-800 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dislikes</label>
            <Textarea
              value={formData.dislikes}
              onChange={(e) => setFormData(prev => ({ ...prev, dislikes: e.target.value }))}
              className="bg-[#0A0A0A] border-gray-800 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isPrivate}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPrivate: checked }))}
              />
              <span className="text-sm">Private Model</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Save Changes
          </Button>

          <div className="border-t border-gray-800 pt-8">
            <h3 className="text-red-500 font-medium mb-4">Danger Zone</h3>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
              className="w-full"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete AI Model
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex items-center justify-center gap-6">
            <a 
              href="https://x.com/girlfriend_cx" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Twitter className="w-5 h-5" />
              <span>@girlfriend_cx</span>
            </a>
            <a 
              href="https://www.instagram.com/girl.friendcx/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <Instagram className="w-5 h-5" />
              <span>@girl.friendcx</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 