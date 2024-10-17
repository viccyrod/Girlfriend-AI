'use client';

import { useState, useEffect } from 'react';
import BaseLayout from '@/components/BaseLayout';
import ChatRoomList from '@/components/chat/ChatRoomList';
import ChatMessages from '@/components/chat/ChatMessages';
import { SimplifiedChatRoom } from '@/types/chat';

export default function ChatPage() {
  const [chatRooms, setChatRooms] = useState<SimplifiedChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<SimplifiedChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRoom = (room: SimplifiedChatRoom) => setSelectedRoom(room);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  async function fetchChatRooms() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const rooms = await response.json();
      setChatRooms(rooms);
    } catch (error: unknown) {
      console.error('Failed to fetch chat rooms:', error);
      setError('Failed to load chat rooms. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <BaseLayout><div>Loading chat rooms...</div></BaseLayout>;
  }

  if (error) {
    return <BaseLayout><div>Error: {error}</div></BaseLayout>;
  }

  return (
    <BaseLayout renderRightPanel={true}>
      <div className="flex h-full bg-background">
        <ChatRoomList
          chatRooms={chatRooms}
          selectedRoom={selectedRoom}
          onSelectRoom={handleSelectRoom}
        />
        <div className="flex-1 flex flex-col">
          {selectedRoom ? (
            <ChatMessages chatRoom={selectedRoom} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-foreground">Select a chat room to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </BaseLayout>
  );
}
