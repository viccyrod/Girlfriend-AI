import { Suspense } from 'react';
import { default as dynamicImport } from 'next/dynamic';
import BaseLayout from '@/components/BaseLayout';
import { getDbUser } from '@/lib/actions/server/auth';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
