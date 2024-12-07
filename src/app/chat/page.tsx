'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import BaseLayout from '@/components/BaseLayout';

// Import ChatComponent with no SSR
const ChatComponent = dynamic(() => import('@/components/chat/ChatComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce" />
        <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce [animation-delay:0.2s]" />
        <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  ),
});

export default function ChatPage() {
  return (
    <BaseLayout>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce" />
            <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce [animation-delay:0.2s]" />
            <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      }>
        <ChatComponent />
      </Suspense>
    </BaseLayout>
  );
}
