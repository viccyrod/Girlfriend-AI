import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import BaseLayout from "@/components/BaseLayout";
import { getOrCreateChatRoom } from "@/lib/actions/chat";
import prisma from "@/lib/prisma";
import { default as dynamicImport } from 'next/dynamic';

export const runtime = 'nodejs';
export const revalidate = 0;

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
    
    if (!user?.id) {
      redirect('/api/auth/login');
    }

    // First verify the AI Model exists
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
      console.error('AI Model not found');
      redirect('/chat');
    }

    const chatRoom = await getOrCreateChatRoom(params.id);

    if (!chatRoom) {
      console.error('Failed to get or create chat room');
      redirect('/chat');
    }

    return (
      <BaseLayout>
        <div className="h-[calc(100vh-4rem)]">
          <ChatRoomClient 
            chatRoom={chatRoom} 
            aiModel={aiModel} 
            modelId={params.id} 
          />
        </div>
      </BaseLayout>
    );
  } catch (error) {
    console.error('Chat page error:', error);
    redirect('/chat');
  }
}
