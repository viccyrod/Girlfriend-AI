'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Smile, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImageGenerationMenu } from './ImageGenerationMenu';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onGenerateImage?: (prompt: string) => Promise<void>;
  isLoading: boolean;
  maxLength?: number;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  onGenerateImage,
  isLoading,
  maxLength = 4000
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const adjustHeight = () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    // Initial height adjustment
    adjustHeight();

    // Adjust on window resize
    window.addEventListener('resize', adjustHeight);
    return () => window.removeEventListener('resize', adjustHeight);
  }, [value]);

  const handleGenerateImage = async (prompt: string) => {
    if (onGenerateImage) {
      setIsGenerating(true);
      try {
        await onGenerateImage(prompt);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <>
      <div className="relative bg-black/50 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={onSubmit} className="flex items-end gap-2 p-2 sm:p-4">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={onChange}
                onKeyDown={onKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full resize-none bg-[#1a1a1a] rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                style={{ minHeight: '44px', maxHeight: '200px' }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !value.trim()}
              className="shrink-0 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 disabled:hover:bg-pink-500 h-[44px] w-[44px] rounded-xl flex items-center justify-center transition-colors duration-200"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Image Generation Menu */}
      {onGenerateImage && (
        <ImageGenerationMenu
          isOpen={isImageMenuOpen}
          onClose={() => setIsImageMenuOpen(false)}
          onGenerate={handleGenerateImage}
          setIsLoading={setIsGenerating}
        />
      )}
    </>
  );
} 