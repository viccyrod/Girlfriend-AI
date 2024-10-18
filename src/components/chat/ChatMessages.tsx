import React from 'react';
import { ChatRoom } from '@prisma/client';
import dynamic from 'next/dynamic';

interface ChatMessagesProps {
  chatRoom: ChatRoom;
}

const ClientChatMessages = dynamic(() => import('./ClientChatMessages'), { ssr: false });

export default function ChatMessages({ chatRoom }: ChatMessagesProps) {
  return <ClientChatMessages chatRoom={chatRoom} />;
}
