'use client';

import { useState } from 'react';
import { AIModelCreationForm } from '@/components/AIModelCreationForm';
import { MagicAIModelCreationForm } from '@/components/MagicAIModelCreationForm';
import { GuidedCreationForm } from './GuidedCreationForm';
import { Button } from '@/components/ui/button';
import { Wand2, Pencil, Sparkles } from 'lucide-react';
import { User } from '@prisma/client';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreateAIModelClientProps {
  user: User;
}

type CreationMode = 'magic' | 'manual' | 'guided';

export default function CreateAIModelClient({ user }: CreateAIModelClientProps) {
  const [creationMode, setCreationMode] = useState<CreationMode>('guided');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 bg-[#0a0a0a]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_60%,var(--tw-gradient-from)_10%,var(--tw-gradient-to)_90%)] from-pink-500/10 via-purple-500/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(80%_20%_at_50%_0%,var(--tw-gradient-stops))] from-purple-500/10 via-background/5 to-transparent" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "max-w-4xl mx-auto space-y-8",
          isLoading && "opacity-0 pointer-events-none"
        )}
      >
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
            Create Your Perfect AI Companion
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Choose your preferred creation method to bring your ideal companion to life
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-2xl mx-auto">
          <Button 
            onClick={() => setCreationMode('guided')}
            variant={creationMode === 'guided' ? 'default' : 'outline'}
            className={`group flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl text-lg transition-all duration-300 ${
              creationMode === 'guided' 
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]' 
                : 'hover:bg-primary/5 border-primary/10'
            }`}
          >
            <Sparkles className={`w-5 h-5 transition-transform duration-300 ${creationMode === 'guided' ? 'scale-110 group-hover:scale-100' : 'group-hover:scale-110'}`} />
            Guided Creation
          </Button>
          <Button 
            onClick={() => setCreationMode('magic')}
            variant={creationMode === 'magic' ? 'default' : 'outline'}
            className={`group flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl text-lg transition-all duration-300 ${
              creationMode === 'magic' 
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]' 
                : 'hover:bg-primary/5 border-primary/10'
            }`}
          >
            <Wand2 className={`w-5 h-5 transition-transform duration-300 ${creationMode === 'magic' ? 'rotate-12 group-hover:rotate-0' : 'group-hover:rotate-12'}`} />
            Magic Creation
          </Button>
          <Button 
            onClick={() => setCreationMode('manual')}
            variant={creationMode === 'manual' ? 'default' : 'outline'}
            className={`group flex-1 flex items-center justify-center gap-3 py-6 rounded-2xl text-lg transition-all duration-300 ${
              creationMode === 'manual' 
                ? 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]' 
                : 'hover:bg-primary/5 border-primary/10'
            }`}
          >
            <Pencil className={`w-5 h-5 transition-transform duration-300 ${creationMode === 'manual' ? '-rotate-12 group-hover:rotate-0' : 'group-hover:-rotate-12'}`} />
            Manual Creation
          </Button>
        </div>

        <motion.div 
          key={creationMode}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-background/40 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-primary/10 shadow-2xl"
        >
          {creationMode === 'magic' ? (
            <MagicAIModelCreationForm user={user} setParentLoading={setIsLoading} />
          ) : creationMode === 'guided' ? (
            <GuidedCreationForm user={user} setParentLoading={setIsLoading} />
          ) : (
            <AIModelCreationForm user={user} setParentLoading={setIsLoading} />
          )}
        </motion.div>
      </motion.div>
    </div>
  );
} 