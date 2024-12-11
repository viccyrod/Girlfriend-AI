import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageGenerationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ImageGenerationMenu({
  isOpen,
  onClose,
  onGenerate,
  setIsLoading
}: ImageGenerationMenuProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    try {
      setIsGenerating(true);
      setIsLoading(true);
      await onGenerate(prompt);
      setPrompt('');
      onClose();
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0a] border-white/5 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            <ImageIcon className="w-5 h-5 text-pink-500" />
            Generate Image
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Describe what you want to see, and I'll create it for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A beautiful sunset on a beach, with waves crashing against the shore..."
            className="bg-[#1a1a1a] border-white/10 focus:ring-pink-500/20 focus:border-pink-500/20 h-32 resize-none text-white placeholder:text-white/20"
          />
          
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              className="border-white/10 hover:bg-white/5 text-white/70 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className={cn(
                "relative group",
                "bg-gradient-to-r from-pink-500 to-purple-600",
                "hover:from-pink-600 hover:to-purple-700",
                "text-white font-medium",
                "transition-all duration-200",
                "disabled:opacity-50",
                "px-4 py-2 rounded-lg"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Magic...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="pt-4 border-t border-white/5">
            <h4 className="text-sm font-medium text-white/40 mb-2">Quick Ideas:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                "Portrait photo",
                "Full body shot",
                "Casual outfit",
                "Elegant dress",
                "Beach day",
                "City lights"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setPrompt(prev => 
                    prev ? `${prev}, ${suggestion.toLowerCase()}` : suggestion
                  )}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg",
                    "bg-white/5 hover:bg-white/10",
                    "text-white/60 hover:text-white",
                    "transition-colors duration-200",
                    "border border-white/10"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
