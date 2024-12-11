'use client';

import { Message } from '@prisma/client';
import { ExtendedChatRoom } from "@/types/chat";
import ChatComponent from "@/components/chat/ChatComponent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AIModel } from "@prisma/client";

interface ChatRoomClientProps {
  chatRoom: any; // Temporarily use any to fix type issues
  aiModel: AIModel | null;
  modelId: string;
}

export default function ChatRoomClient({ chatRoom, aiModel, modelId }: ChatRoomClientProps) {
  // Transform the data into the expected format
  const extendedChatRoom: ExtendedChatRoom = {
    id: chatRoom.id,
    name: chatRoom.name || `Chat with ${aiModel?.name}`,
    aiModelId: modelId,
    createdById: chatRoom.createdById,
    createdAt: new Date(chatRoom.createdAt),
    updatedAt: new Date(chatRoom.updatedAt),
    users: chatRoom.users?.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image
    })) || [],
    messages: (chatRoom.messages || []).map((msg: any) => ({
      id: msg.id,
      content: msg.content,
      chatRoomId: msg.chatRoomId,
      createdAt: new Date(msg.createdAt),
      updatedAt: new Date(msg.updatedAt),
      isAIMessage: msg.isAIMessage,
      metadata: msg.metadata,
      userId: msg.userId,
      aiModelId: msg.aiModelId,
      role: msg.isAIMessage ? 'assistant' : 'user',
      user: msg.user
    })),
    aiModel: chatRoom.aiModel ? {
      id: chatRoom.aiModel.id,
      name: chatRoom.aiModel.name,
      personality: chatRoom.aiModel.personality,
      appearance: chatRoom.aiModel.appearance,
      backstory: chatRoom.aiModel.backstory,
      hobbies: chatRoom.aiModel.hobbies,
      likes: chatRoom.aiModel.likes,
      dislikes: chatRoom.aiModel.dislikes,
      age: chatRoom.aiModel.age || 25,
      imageUrl: chatRoom.aiModel.imageUrl,
      voiceId: chatRoom.aiModel.voiceId,
      messageCount: chatRoom.aiModel.messageCount || 0,
      imageCount: chatRoom.aiModel.imageCount || 0,
      createdAt: new Date(chatRoom.aiModel.createdAt),
      updatedAt: new Date(chatRoom.aiModel.updatedAt),
      userId: chatRoom.aiModel.userId,
      followerCount: chatRoom.aiModel.followerCount || 0,
      isPrivate: chatRoom.aiModel.isPrivate || false,
      isAnime: chatRoom.aiModel.isAnime || false,
      isHumanX: chatRoom.aiModel.isHumanX || false,
      status: chatRoom.aiModel.status || 'COMPLETED',
      createdBy: chatRoom.aiModel.createdBy ? {
        id: chatRoom.aiModel.createdBy.id,
        name: chatRoom.aiModel.createdBy.name,
        email: chatRoom.aiModel.createdBy.email,
        image: chatRoom.aiModel.createdBy.image
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