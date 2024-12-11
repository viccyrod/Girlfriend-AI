'use client';

import React from 'react';
import { User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ChatInfoBarProps {
  modelImage?: string | null;
  modelName: string;
  modelPersonality: string;
  onViewProfile?: () => void;
}

export function ChatInfoBar({
  modelImage,
  modelName,
  modelPersonality,
  onViewProfile
}: ChatInfoBarProps) {
  return (
    <div className="shrink-0 border-b border-white/5 bg-[#0f0f0f]">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Model Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
              {modelImage ? (
                <Image
                  src={modelImage}
                  alt={modelName}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  sizes="40px"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-white/30" />
                </div>
              )}
            </div>
            {/* Online Status */}
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0f0f0f]" />
          </div>

          {/* Model Info */}
          <div>
            <h3 className="text-[15px] font-medium text-white">
              {modelName}
            </h3>
            <p className="text-xs text-white/50">
              {modelPersonality.split(' ').slice(0, 6).join(' ')}
            </p>
          </div>
        </div>

        {/* View Profile Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewProfile}
          className={cn(
            "text-white/70 hover:text-white",
            "bg-white/5 hover:bg-white/10",
            "transition-colors duration-200"
          )}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View Profile
        </Button>
      </div>
    </div>
  );
} 