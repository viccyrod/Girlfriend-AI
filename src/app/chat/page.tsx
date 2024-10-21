'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import BaseLayout from '@/components/BaseLayout';

const ChatComponent = dynamic(() => import('@/components/chat/ChatComponent'), {
  loading: () => <p>Loading chat...</p>,
});

export default function ChatPage() {
  return (
    <BaseLayout>
      <Suspense fallback={<div>Loading chat...</div>}>
        <ChatComponent />
      </Suspense>
    </BaseLayout>
  );
}
