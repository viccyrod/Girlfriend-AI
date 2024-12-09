import { Suspense } from 'react';
import { default as dynamicImport } from 'next/dynamic';
import BaseLayout from '@/components/BaseLayout';
import { getDbUser } from '@/lib/actions/server/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your Chats | Girlfriend.cx',
  description: 'View and manage your conversations with AI companions. Continue meaningful discussions and build deeper connections.',
  openGraph: {
    title: 'Your AI Companion Chats | Girlfriend.cx',
    description: 'View and manage your conversations with AI companions. Continue meaningful discussions and build deeper connections.',
    images: [{
      url: '/chat-preview.jpg',
      width: 1200,
      height: 630,
      alt: 'Girlfriend.cx Chat Interface'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Your AI Companion Chats | Girlfriend.cx',
    description: 'View and manage your conversations with AI companions. Continue meaningful discussions and build deeper connections.',
    images: ['/chat-preview.jpg'],
  },
}

// Import ChatComponent with no SSR
const ChatComponent = dynamicImport(() => import('@/components/chat/ChatComponent'), {
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

export default async function ChatPage() {
  const user = await getDbUser();
  if (!user) redirect('/auth/login');

  return (
    <BaseLayout>
      <ChatComponent />
    </BaseLayout>
  );
}
