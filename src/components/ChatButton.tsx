"use client";

import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { getOrCreateChatRoom } from '@/lib/actions/chat';

export default function ChatButton({ modelId }: { modelId: string }) {
  const router = useRouter();
  const { user } = useKindeBrowserClient();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/api/auth/login?post_login_redirect_url=/chat');
      return;
    }

    try {
      const chatRoom = await getOrCreateChatRoom(modelId);
      if (chatRoom) {
        router.push(`/chat/${modelId}`);
      }
    } catch (error) {
      console.error('Failed to create chat room:', error);
    }
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
