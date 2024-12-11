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
      <div className="shrink-0 border-t border-white/5 bg-[#0f0f0f]">
        <form onSubmit={onSubmit} className="p-2 md:p-3 flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={onChange}
              onKeyDown={onKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                "w-full resize-none",
                "px-3 py-2.5 md:px-4 md:py-3",
                "rounded-xl",
                "bg-[#1a1a1a] border border-white/10",
                "focus:outline-none focus:ring-2 focus:ring-pink-500/20",
                "placeholder:text-white/20",
                "text-white text-[15px]",
                "min-h-[44px] max-h-[160px]",
                "transition-all duration-200",
                "scrollbar-pretty",
                "touch-manipulation",
                isLoading && "opacity-50"
              )}
              disabled={isLoading}
              maxLength={maxLength}
            />
            {/* Character Count */}
            <div className="absolute right-2 bottom-2 md:right-3 md:bottom-3 text-xs text-white/30">
              {value.length}/{maxLength}
            </div>
          </div>

          {/* Image Generation Button */}
          {onGenerateImage && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsImageMenuOpen(true)}
              className={cn(
                "h-11 w-11 rounded-xl",
                "hover:bg-white/5",
                "items-center justify-center",
                "transition-all duration-200",
                isGenerating && "opacity-50 cursor-not-allowed"
              )}
              disabled={isGenerating}
            >
              <ImageIcon className="w-5 h-5 text-white/50" />
            </Button>
          )}

          {/* Emoji Button - Hidden on narrow mobile */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "hidden sm:flex h-11 w-11 rounded-xl",
              "hover:bg-white/5",
              "items-center justify-center"
            )}
          >
            <Smile className="w-5 h-5 text-white/50" />
          </Button>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={!value.trim() || isLoading || value.length > maxLength}
            className={cn(
              "h-11 aspect-square md:px-4 md:aspect-auto rounded-xl",
              "bg-gradient-to-r from-pink-500 to-purple-600",
              "text-white font-medium",
              "transition-all duration-200",
              "disabled:opacity-50",
              "relative overflow-hidden",
              "hover:shadow-lg hover:shadow-pink-500/20",
              "active:scale-95",
              "touch-manipulation",
              "group"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 relative z-10 md:mr-2" />
                <span className="hidden md:inline relative z-10">Send</span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </>
            )}
          </Button>
        </form>
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