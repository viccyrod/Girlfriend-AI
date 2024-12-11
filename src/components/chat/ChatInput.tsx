'use client';

import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  maxLength?: number;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  isLoading,
  maxLength = 4000
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
    <div className="shrink-0 border-t border-white/5 bg-[#0f0f0f]">
      <form onSubmit={onSubmit} className="px-4 py-3 flex gap-2 items-end">
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
              "px-4 py-3 rounded-xl",
              "bg-[#1a1a1a] border border-white/10",
              "focus:outline-none focus:ring-2 focus:ring-pink-500/20",
              "placeholder:text-white/20",
              "text-white",
              "min-h-[44px] max-h-[120px]",
              "transition-all duration-200",
              "scrollbar-pretty",
              isLoading && "opacity-50"
            )}
            disabled={isLoading}
            maxLength={maxLength}
          />
          {/* Character Count */}
          <div className="absolute right-3 bottom-3 text-xs text-white/30">
            {value.length}/{maxLength}
          </div>
        </div>

        {/* Emoji Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-xl hover:bg-white/5"
        >
          <Smile className="w-5 h-5 text-white/50" />
        </Button>

        {/* Send Button */}
        <Button
          type="submit"
          disabled={!value.trim() || isLoading || value.length > maxLength}
          className={cn(
            "h-11 px-4 rounded-xl",
            "bg-gradient-to-r from-pink-500 to-purple-600",
            "text-white font-medium",
            "transition-all duration-200",
            "disabled:opacity-50",
            "relative overflow-hidden",
            "hover:shadow-lg hover:shadow-pink-500/20",
            "group"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
} 