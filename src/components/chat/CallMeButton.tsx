import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CallMeButton() {
  return (
    <div className="relative">
      <Button 
        className={cn(
          "w-full relative overflow-hidden",
          "bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500",
          "hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600",
          "text-white font-semibold py-6",
          "transition-all duration-300 ease-out",
          "shadow-lg hover:shadow-xl",
          "border-0"
        )}
        disabled
      >
        Call Me
        <div className="absolute top-0 right-0 px-2 py-1 translate-x-2 -translate-y-2">
          <div className="relative">
            <span className="absolute inset-0 bg-black/20 blur-sm rounded-full" />
            <span className="relative bg-black/40 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              Coming Soon
            </span>
          </div>
        </div>
      </Button>
    </div>
  );
} 