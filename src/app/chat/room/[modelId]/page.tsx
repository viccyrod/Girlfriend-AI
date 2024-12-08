import { redirect } from 'next/navigation';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import ChatComponent from '@/components/chat/ChatComponent';
import { ExtendedChatRoom } from '@/types/chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ChatRoomPage({ params }: { params: { modelId: string } }) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user?.id) redirect('/auth/login');

  // Rest of the page logic...
  return <ChatComponent modelId={params.modelId} />;
}
