import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import BaseLayout from "@/components/BaseLayout";
import { getOrCreateChatRoom } from "@/lib/actions/chat";
import prisma from "@/lib/prisma";
import { default as dynamicImport } from 'next/dynamic';
import { Metadata, ResolvingMetadata } from 'next';

export const runtime = 'nodejs';
export const revalidate = 0;

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
    description: `Have a meaningful conversation with ${aiModel.name}, your AI companion. Experience personalized interactions in a safe, judgment-free space.`,
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

const ChatRoomClient = dynamicImport(() => import('@/components/ChatRoomClient'), {
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

export default async function ChatPage({ params }: { params: { id: string } }) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    // First try to find the chat room
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            id: user?.id
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
        }
      }
    });

    if (!chatRoom) {
      // If no chat room found, try to find AI model (for new chat creation)
      const aiModel = await prisma.aIModel.findUnique({
        where: { id: params.id },
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
      });

      if (!aiModel) {
        console.error('Neither chat room nor AI Model found');
        redirect('/chat');
      }

      // Create new chat room
      const newChatRoom = await getOrCreateChatRoom(params.id);
      if (!newChatRoom) {
        console.error('Failed to create chat room');
        redirect('/chat');
      }

      return (
        <BaseLayout requireAuth={true}>
          <div className="h-[calc(100vh-4rem)]">
            <ChatRoomClient 
              chatRoom={newChatRoom} 
              aiModel={aiModel} 
              modelId={params.id} 
            />
          </div>
        </BaseLayout>
      );
    }

    // Verify the AI model exists and is ready
    if (!chatRoom.aiModel) {
      console.error('AI Model not found for chat room:', chatRoom.id);
      redirect('/chat');
    }

    if (chatRoom.aiModel.status === 'PENDING') {
      console.error('AI Model is pending for room:', chatRoom.id);
      redirect('/chat');
    }

    return (
      <BaseLayout requireAuth={true}>
        <div className="h-[calc(100vh-4rem)]">
          <ChatRoomClient 
            chatRoom={chatRoom} 
            aiModel={chatRoom.aiModel} 
            modelId={chatRoom.aiModelId || params.id} 
          />
        </div>
      </BaseLayout>
    );
  } catch (error) {
    console.error('Chat page error:', error);
    redirect('/chat');
  }
}
