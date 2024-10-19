import React from 'react';
import dynamic from 'next/dynamic';
import { ExtendedChatRoom } from '@/types/chat'; // Adjust the import path as needed

interface ChatMessagesProps {
  chatRoom: ExtendedChatRoom;
}

const ClientChatMessages = dynamic(() => import('./ClientChatMessages'), { ssr: false });

export default function ChatMessages({ chatRoom }: ChatMessagesProps) {
  return <ClientChatMessages chatRoom={chatRoom} />;
}
