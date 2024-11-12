// Importing necessary modules and components
import { redirect } from "next/navigation"; // Used to programmatically navigate to another page in Next.js
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"; // Used to manage server-side authentication with Kinde
import ChatComponent from "@/components/chat/ChatComponent"; // Chat UI component
import BaseLayout from "@/components/BaseLayout"; // Base layout component to wrap the page's content
import { getOrCreateChatRoom } from "@/lib/actions/chat"; // Utility function to get or create a chat room
import {  ExtendedChatRoom } from "@/types/chat";


// Main function that renders the ChatPage component
export default async function ChatPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  // Get the server session and user information
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // If the user is not authenticated, redirect to the login page
  if (!user) {
    redirect('/auth/login');
  }

  try {
    // Use the id parameter directly as modelId
    const chatRoom = await getOrCreateChatRoom(params.id);
    console.log('AI Model:', JSON.stringify(chatRoom.aiModel, null, 2));
    
    if (!chatRoom) {
      return <div>Chat room not found</div>;
    }

    // Ensure all required properties are present with proper types
    const extendedChatRoom: ExtendedChatRoom = {
      id: chatRoom.id,
      name: chatRoom.name || '',
      aiModelId: chatRoom.aiModelId || '',
      aiModelImageUrl: chatRoom.aiModel?.imageUrl || null,
      users: chatRoom.users || [],
      messages: chatRoom.messages?.map(msg => ({
        ...msg,
        role: msg.isAIMessage ? 'assistant' : 'user',
        metadata: msg.metadata as Record<string, string> | undefined
      })) || [],
      createdAt: new Date(chatRoom.createdAt || Date.now()),
      updatedAt: new Date(chatRoom.updatedAt || Date.now()),
      createdBy: chatRoom.aiModel?.createdBy ? {
        id: chatRoom.aiModel.createdBy.id || '',
        name: chatRoom.aiModel.createdBy.name || '',
        email: chatRoom.aiModel.createdBy.email || '',
        imageUrl: chatRoom.aiModel.createdBy.imageUrl || null
      } : {
        id: '',
        name: '',
        email: '',
        imageUrl: null
      },
      aiModel: {
        id: chatRoom.aiModel?.id || '',
        name: chatRoom.aiModel?.name || '',
        personality: chatRoom.aiModel?.personality || '',
        appearance: chatRoom.aiModel?.appearance || '',
        backstory: chatRoom.aiModel?.backstory || '',
        hobbies: chatRoom.aiModel?.hobbies || '',
        likes: chatRoom.aiModel?.likes || '',
        dislikes: chatRoom.aiModel?.dislikes || '',
        createdBy: chatRoom.aiModel?.createdBy ? {
          id: chatRoom.aiModel.createdBy.id || '',
          name: chatRoom.aiModel.createdBy.name || '',
          email: chatRoom.aiModel.createdBy.email || '',
          imageUrl: chatRoom.aiModel.createdBy.imageUrl || null 
        } : {
          id: '',
          name: '',
          email: '',
          imageUrl: null
        },
        userId: chatRoom.aiModel?.userId || '',
        followerCount: chatRoom.aiModel?.followerCount || 0,
        isPrivate: chatRoom.aiModel?.isPrivate || false,
        isAnime: chatRoom.aiModel?.isAnime || false,
        isHuman: false,
        isHumanX: false,
        isFollowing: false,
        age: chatRoom.aiModel?.age ? Number(chatRoom.aiModel.age) : null,
        imageUrl: chatRoom.aiModel?.imageUrl || '',
        createdAt: new Date(chatRoom.aiModel?.createdAt || Date.now()),
        updatedAt: new Date(chatRoom.aiModel?.updatedAt || Date.now())
      }
    };

    return (
      <BaseLayout>
        <div className="h-[calc(100vh-4rem)]">
          <ChatComponent 
            initialChatRoom={extendedChatRoom} 
            modelId={params.id} 
          />
        </div>
      </BaseLayout>
    );
  } catch (error) {
    console.error('Error:', error);
    redirect('/community');
  }
}

