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

const truncateDescription = (text: string, limit: number = 30) => {
  if (text.length <= limit) return text;
  return text.slice(0, limit).trim() + '...';
};

export function ChatInfoBar({
  modelImage,
  modelName,
  modelPersonality,
  onViewProfile
}: ChatInfoBarProps) {
  return (
    <div className="shrink-0 border-b border-white/5 bg-[#0f0f0f]">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Model Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-gradient-to-br from-pink-500/10 to-purple-500/10">
              {modelImage ? (
                <Image
                  src={modelImage}
                  alt={modelName}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  sizes="40px"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white/30" />
                </div>
              )}
            </div>
            {/* Online Status */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 p-0.5">
              <div className="w-full h-full rounded-full bg-[#0f0f0f] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>

          {/* Model Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-medium bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                {modelName}
              </h3>
              <div className="h-4 w-px bg-white/5" />
              <span className="text-xs text-white/30 font-medium">Online</span>
            </div>
            <p className="text-xs text-white/50 max-w-[200px] truncate">
              {truncateDescription(modelPersonality)}
            </p>
          </div>
        </div>

        {/* View Profile Button */}
        {onViewProfile && (
          <Button
            variant="ghost"
            onClick={onViewProfile}
            className={cn(
              "h-8 px-3 rounded-full",
              "bg-gradient-to-r from-pink-500/10 to-purple-500/10",
              "hover:from-pink-500/20 hover:to-purple-500/20",
              "border border-white/5",
              "transition-all duration-300",
              "group flex items-center gap-2",
              "hover:gap-3 hover:pr-2",
              "text-xs font-medium"
            )}
          >
            <span className="text-white/70 group-hover:text-white">View Profile</span>
            <ExternalLink className="w-3.5 h-3.5 text-pink-500/70 group-hover:text-pink-500" />
          </Button>
        )}
      </div>
    </div>
  );
} 