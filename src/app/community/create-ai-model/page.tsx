'use client';

import { useState } from 'react';
import { AIModelCreationForm } from '@/components/AIModelCreationForm';
import { MagicAIModelCreationForm } from '@/components/MagicAIModelCreationForm';
import BaseLayout from '@/components/BaseLayout';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

export default function CreateAIModelPage() {
  const [creationMode, setCreationMode] = useState<'manual' | 'magic'>('magic');

  return (
    <BaseLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Your Own AI Model</h1>
        <div className="flex justify-center space-x-4 mb-8">
          <Button 
            onClick={() => setCreationMode('magic')}
            variant={creationMode === 'magic' ? 'default' : 'outline'}
            className="flex items-center"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Magic Creation
          </Button>
          <Button 
            onClick={() => setCreationMode('manual')}
            variant={creationMode === 'manual' ? 'default' : 'outline'}
          >
            Manual Creation
          </Button>
        </div>
        {creationMode === 'magic' ? <MagicAIModelCreationForm /> : <AIModelCreationForm />}
      </div>
    </BaseLayout>
  );
}
