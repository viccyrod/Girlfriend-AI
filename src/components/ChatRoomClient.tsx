'use client';

import { Message } from '@prisma/client';
import { ExtendedChatRoom } from "@/types/chat";
import ChatComponent from "@/components/chat/ChatComponent";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ChatRoomClientProps {
  chatRoom: any; // Replace with proper type
  aiModel: any; // Replace with proper type
  modelId: string;
}

export default function ChatRoomClient({ chatRoom, aiModel, modelId }: ChatRoomClientProps) {
  // Transform the data into the expected format
  const extendedChatRoom: ExtendedChatRoom = {
    id: chatRoom.id,
    name: chatRoom.name || `Chat with ${aiModel.name}`,
    aiModelId: chatRoom.aiModelId || modelId,
    aiModelImageUrl: chatRoom.aiModel?.imageUrl || null,
    users: chatRoom.users?.map((user: any) => ({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      image: user.image,
      isSubscribed: false,
      customerId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isAI: false,
      bio: null
    })) || [],
    messages: (chatRoom.messages || []).map((msg: Message) => ({
      ...msg,
      role: msg.isAIMessage ? 'assistant' : 'user',
      metadata: msg.metadata as Record<string, string> | undefined
    })),
    createdAt: new Date(chatRoom.createdAt),
    updatedAt: new Date(chatRoom.updatedAt),
    voiceId: chatRoom.aiModel?.voiceId || null,
    createdBy: chatRoom.aiModel?.createdBy ? {
      id: chatRoom.aiModel.createdBy.id,
      name: chatRoom.aiModel.createdBy.name || '',
      email: chatRoom.aiModel.createdBy.email || '',
      imageUrl: chatRoom.aiModel.createdBy.image
    } : null,
    aiModel: chatRoom.aiModel ? {
      ...chatRoom.aiModel,
      createdAt: new Date(chatRoom.aiModel.createdAt),
      updatedAt: new Date(chatRoom.aiModel.updatedAt),
      voiceId: chatRoom.aiModel.voiceId || null,
      isFollowing: false,
      isAnime: false,
      age: null,
      isHumanX: chatRoom.aiModel.isHumanX || false,
      createdBy: chatRoom.aiModel.createdBy ? {
        id: chatRoom.aiModel.createdBy.id,
        name: chatRoom.aiModel.createdBy.name || '',
        email: chatRoom.aiModel.createdBy.email || '',
        imageUrl: chatRoom.aiModel.createdBy.image
      } : null
    } : null
  };

  return (
    <ErrorBoundary>
      <ChatComponent 
        initialChatRoom={extendedChatRoom} 
        modelId={modelId} 
      />
    </ErrorBoundary>
  );
} 