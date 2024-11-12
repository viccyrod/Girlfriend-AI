import React from 'react';
import { ExtendedChatRoom } from '@/types/chat';
import ClientChatMessages from './ClientChatMessages';

interface ChatMessagesProps {
  chatRoom: ExtendedChatRoom;
}

export default function ChatMessages({ chatRoom }: ChatMessagesProps) {
  const safeAiModel = chatRoom.aiModel ? {
    ...chatRoom.aiModel,
    imageUrl: chatRoom.aiModel.imageUrl ?? ''
  } : null;
  return <ClientChatMessages 
    chatRoom={{ ...chatRoom, aiModel: safeAiModel }} 
    onSendMessage={async () => {}} 
    _isLoading={false} 
  />;
}
