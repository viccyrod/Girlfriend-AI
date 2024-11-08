import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/clients/prisma';
import ChatComponent from '@/components/chat/ChatComponent';
import { ExtendedChatRoom } from '@/types/chat';

export default async function ChatRoomPage({ 
  params 
}: { 
  params: { modelId: string } 
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth/login');

  const chatRoom = await prisma.chatRoom.findUnique({
    where: { 
      id: params.modelId,
      users: {
        some: {
          id: currentUser.id
        }
      }
    },
    include: {
      aiModel: {
        include: {
          createdBy: true
        }
      },
      users: true,
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
    }
  });

  if (!chatRoom) redirect('/chat');

  const extendedChatRoom = {
    ...chatRoom,
    aiModel: chatRoom.aiModel ? {
      ...chatRoom.aiModel,
      isHuman: false,
      isFollowing: false
    } : undefined,
    aiModelImageUrl: chatRoom.aiModel?.imageUrl || '',
    createdBy: currentUser
  };

  return <ChatComponent initialChatRoom={extendedChatRoom as ExtendedChatRoom} modelId={params.modelId}  />;
}
