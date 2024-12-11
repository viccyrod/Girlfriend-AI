'use client';

import { ExtendedChatRoom } from "@/types/chat";
import ChatComponent from "@/components/chat/ChatComponent";
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface ChatRoomClientProps {
  chatRoom: ExtendedChatRoom;
}

export default function ChatRoomClient({ chatRoom }: ChatRoomClientProps) {
  const validatedChatRoom: ExtendedChatRoom = {
    ...chatRoom,
    aiModelId: chatRoom.aiModelId || '',
    createdById: chatRoom.createdById || null,
    aiModel: chatRoom.aiModel ? {
      ...chatRoom.aiModel,
      age: chatRoom.aiModel.age || 0,
      status: chatRoom.aiModel.status || 'PENDING',
      messageCount: chatRoom.aiModel.messageCount || 0,
      imageCount: chatRoom.aiModel.imageCount || 0,
      createdBy: chatRoom.aiModel.createdBy ? {
        ...chatRoom.aiModel.createdBy,
        name: chatRoom.aiModel.createdBy.name || null,
        email: chatRoom.aiModel.createdBy.email || null,
        image: chatRoom.aiModel.createdBy.image || null
      } : null
    } : null
  };

  return (
    <ErrorBoundary>
      <ChatComponent 
        initialChatRoom={validatedChatRoom} 
        modelId={validatedChatRoom.aiModelId} 
      />
    </ErrorBoundary>
  );
} 