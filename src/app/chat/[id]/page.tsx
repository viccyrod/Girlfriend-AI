// Importing necessary modules and components
import { redirect } from "next/navigation"; // Used to programmatically navigate to another page in Next.js
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"; // Used to manage server-side authentication with Kinde
import ChatComponent from "@/components/chat/ChatComponent"; // Chat UI component
import BaseLayout from "@/components/BaseLayout"; // Base layout component to wrap the page's content
import { getOrCreateChatRoom } from "@/lib/actions/chat"; // Utility function to get or create a chat room
import {  ExtendedChatRoom } from "@/types/chat";
import { Message } from '@prisma/client'; // Add this import
import prisma from "@/lib/prisma";
import { ErrorBoundary } from "@/components/ErrorBoundary";


// Main function that renders the ChatPage component
export default async function ChatPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user) {
      redirect('/auth/login');
    }

// First verify the AI Model exists
const aiModel = await prisma.aIModel.findUnique({
  where: { id: params.id }
});

    if (!aiModel) {
      console.error('AI Model not found');
      redirect('/chat');
    }

const chatRoom = await getOrCreateChatRoom(params.id);

    // Ensure all required properties are present with proper types
    const extendedChatRoom: ExtendedChatRoom = {
      id: chatRoom.id,
      name: chatRoom.name || '',
      aiModelId: chatRoom.aiModelId || '',
      aiModelImageUrl: chatRoom.aiModel?.imageUrl || null,
      users: chatRoom.users || [],
      messages: chatRoom.messages?.map((msg: Message) => ({
        ...msg,
        role: msg.isAIMessage ? 'assistant' : 'user',
        metadata: msg.metadata as Record<string, string> | undefined
      })) || [],
      createdAt: new Date(chatRoom.createdAt || Date.now()),
      updatedAt: new Date(chatRoom.updatedAt || Date.now()),
      voiceId: chatRoom.voiceId || null,
      createdBy: chatRoom.aiModel?.createdBy ? {
        id: chatRoom.aiModel.createdBy.id || '',
        name: chatRoom.aiModel.createdBy.name || '',
        email: chatRoom.aiModel.createdBy.email || '',
        imageUrl: chatRoom.aiModel.createdBy.image || null
      } : {
        id: '',
        name: '',
        email: '',
        imageUrl: null
      },
      aiModel: chatRoom.aiModel ? {
        ...chatRoom.aiModel,
        createdAt: new Date(chatRoom.aiModel.createdAt),
        updatedAt: new Date(chatRoom.aiModel.updatedAt),
        voiceId: chatRoom.aiModel.voiceId || null,
        isFollowing: chatRoom.aiModel.isFollowing || false,
        isAnime: chatRoom.aiModel.isAnime || false,
        age: chatRoom.aiModel.age || null,
        isHumanX: chatRoom.aiModel.isHumanX || false,
        createdBy: chatRoom.aiModel.createdBy ? {
          id: chatRoom.aiModel.createdBy.id || '',
          name: chatRoom.aiModel.createdBy.name || '',
          email: chatRoom.aiModel.createdBy.email || '',
          imageUrl: chatRoom.aiModel.createdBy.image || null
        } : null
      } : null,
    };

    return (
      <BaseLayout>
        <div className="h-[calc(100vh-4rem)]">
          <ErrorBoundary>
            <ChatComponent 
              initialChatRoom={extendedChatRoom} 
              modelId={params.id} 
            />
          </ErrorBoundary>
        </div>
      </BaseLayout>
    );
  } catch (error) {
    console.error('Chat page error:', error);
    redirect('/chat');  // Redirect to chat list instead of community
  }
}
