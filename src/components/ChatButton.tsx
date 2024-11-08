"use client";

import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatButton({ modelId }: { modelId: string }) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/chat/${modelId}`);
  };

  return (
    <button 
      onClick={handleClick}
      className="absolute top-3 right-3 z-20 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition-colors"
    >
      <MessageSquare className="w-5 h-5 text-white" />
    </button>
  );
}
