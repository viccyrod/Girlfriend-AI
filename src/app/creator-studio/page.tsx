'use client';

import React, { useState, useEffect } from 'react';
import BaseLayout from '@/components/BaseLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Wand2 } from 'lucide-react';
import ConsentDialog from "@/components/creator-studio/ConsentDialog"

// Move phrases array outside component
const MAGIC_PHRASES = [
  "Crafting digital dreams...",
  "Brewing AI magic...",
  "Unleashing virtual charm...",
  "Coding seductive algorithms...",
  "Designing digital desires..."
] as const;

export default function CreatorStudioPage() {
  const [modelName, setModelName] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [magicPhrase, setMagicPhrase] = useState('');
  const [showConsent, setShowConsent] = useState(true)
  const [hasConsented, setHasConsented] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setMagicPhrase(MAGIC_PHRASES[Math.floor(Math.random() * MAGIC_PHRASES.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload images to Cloudinary
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const formData = new FormData();
          formData.append('file', image);
          formData.append('upload_preset', 'your_cloudinary_upload_preset');

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
              method: 'POST',
              body: formData,
            }
          );

          const data = await response.json();
          return data.secure_url;
        })
      );

      // Start model training
      const response = await fetch('/api/train-model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrls, modelName }),
      });

      if (!response.ok) {
        throw new Error('Failed to start model training');
      }

      const result = await response.json();

      toast({
        title: 'Model Training Started',
        description: `Your model "${modelName}" is now training. Job ID: ${result.job.id}`,
      });

      router.push('/my-models');
    } catch (error) {
      console.error('Error starting model training:', error);
      toast({
        title: 'Error',
        description: 'Failed to start model training. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsent = () => {
    setHasConsented(true)
    setShowConsent(false)
  }

  if (!hasConsented) {
    return (
      <BaseLayout>
        <ConsentDialog 
          isOpen={showConsent} 
          onOpenChange={setShowConsent}
          onAccept={handleConsent}
        />
      </BaseLayout>
    )
  }

  return (
    <BaseLayout>
      <div className="container mx-auto py-12 px-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-pink-800 to-red-900">
        <Card className="w-full max-w-3xl mx-auto bg-black/50 backdrop-blur-md border border-pink-500/30">
          <CardContent className="text-center p-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600">
                Creator Studio
              </h1>
            </motion.div>
            <motion.p
              className="text-2xl mb-8 text-pink-200"
              key={magicPhrase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              {magicPhrase}
            </motion.p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  id="modelName"
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  required
                  placeholder="Model Name"
                  className="bg-black/30 border-pink-500/30 text-white placeholder-pink-300/50"
                />
              </div>
              <div>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  required
                  className="bg-black/30 border-pink-500/30 text-white file:bg-pink-500 file:text-white file:border-0"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition duration-300"
              >
                <Wand2 className="mr-2 h-5 w-5" />
                {isLoading ? 'Training...' : 'Start Training'}
              </Button>
            </form>
            <div className="mt-8">
              <Button 
                onClick={() => router.push('/my-models')}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105 transition duration-300"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Explore Your Models
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  );
}
