import React from 'react';
import { ExtendedChatRoom } from '@/types/chat';
import ClientChatMessages from './ClientChatMessages';
import { sendMessage } from '@/lib/actions/chat';
import { useToast } from '@/hooks/use-toast';

interface ChatMessagesProps {
  chatRoom: ExtendedChatRoom;
}

export default function ChatMessages({ chatRoom }: ChatMessagesProps) {
  const { toast } = useToast();
  const safeAiModel = chatRoom.aiModel ? {
    ...chatRoom.aiModel,
    voiceId: chatRoom.aiModel.voiceId || null,
    isAnime: chatRoom.aiModel.isAnime || false,
    isFollowing: chatRoom.aiModel.isFollowing || false,
    age: chatRoom.aiModel.age || null,
    createdAt: new Date(chatRoom.aiModel.createdAt),
    updatedAt: new Date(chatRoom.aiModel.updatedAt),
  } : null;

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(chatRoom.id, content);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return <ClientChatMessages 
    chatRoom={{ ...chatRoom, aiModel: safeAiModel }}
    _onSendMessage={handleSendMessage}
    _isLoading={false} 
  />;
}
