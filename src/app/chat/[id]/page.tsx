import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import BaseLayout from "@/components/BaseLayout";
import prisma from "@/lib/prisma";
import { Metadata, ResolvingMetadata } from 'next';
import ChatRoomClient from './ChatRoomClient';
import { ExtendedChatRoom } from "@/types/chat";
import { MessageMetadata } from "@/types/message";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const aiModel = await prisma.aIModel.findUnique({
    where: { id: params.id },
    select: {
      name: true,
      personality: true,
      imageUrl: true,
    }
  });

  if (!aiModel) {
    return {
      title: 'Chat Not Found',
      description: 'The requested chat could not be found.',
    }
  }

  return {
    title: `Chat with ${aiModel.name} | Girlfriend.cx`,
    description: `Have a meaningful conversation with ${aiModel.name}, your AI companion.`,
    openGraph: {
      title: `Chat with ${aiModel.name} on Girlfriend.cx`,
      description: `Have a meaningful conversation with ${aiModel.name}, your AI companion.`,
      images: [{
        url: aiModel.imageUrl || '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: `Chat with ${aiModel.name}`
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Chat with ${aiModel.name} on Girlfriend.cx`,
      description: `Have a meaningful conversation with ${aiModel.name}, your AI companion.`,
      images: [aiModel.imageUrl || '/placeholder.jpg'],
    },
  }
}

export default async function ChatPage({ params }: { params: { id: string } }) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      redirect('/auth/login');
    }

    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            id: user.id
          }
        }
      },
      include: {
        aiModel: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        messages: {
          take: 30,
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            user: true
          }
        }
      }
    });

    if (!chatRoom) {
      redirect('/chat');
    }

    const extendedChatRoom: ExtendedChatRoom = {
      ...chatRoom,
      aiModelId: chatRoom.aiModelId || '',
      createdById: chatRoom.createdById || null,
      messages: chatRoom.messages.map(msg => ({
        ...msg,
        metadata: msg.metadata as MessageMetadata || { type: 'text' }
      })),
      aiModel: chatRoom.aiModel ? {
        ...chatRoom.aiModel,
        status: (chatRoom.aiModel.status || 'PENDING') as 'PENDING' | 'COMPLETED' | 'FAILED',
        age: chatRoom.aiModel.age || 0,
        messageCount: chatRoom.aiModel.messageCount || 0,
        imageCount: chatRoom.aiModel.imageCount || 0,
        imageUrl: chatRoom.aiModel.imageUrl || null,
        voiceId: chatRoom.aiModel.voiceId || null,
        createdBy: chatRoom.aiModel.createdBy ? {
          id: chatRoom.aiModel.createdBy.id,
          name: chatRoom.aiModel.createdBy.name || null,
          email: chatRoom.aiModel.createdBy.email || null,
          image: chatRoom.aiModel.createdBy.image || null
        } : null
      } : null,
      users: chatRoom.users.map(user => ({
        id: user.id,
        name: user.name || null,
        email: user.email || null,
        image: user.image || null
      }))
    };

    return (
      <BaseLayout requireAuth={true}>
        <div className="h-[calc(100vh-4rem)]">
          <ChatRoomClient chatRoom={extendedChatRoom} />
        </div>
      </BaseLayout>
    );
  } catch (error) {
    console.error('Chat page error:', error);
    redirect('/chat');
  }
}
