'use client';

import React from 'react';
import { ExtendedChatRoom } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Message } from '@/types/message';

interface ChatRoomListProps {
  rooms: ExtendedChatRoom[];
  selectedRoom: ExtendedChatRoom | null;
  onRoomSelect: (room: ExtendedChatRoom) => void;
  onDeleteRoom?: (roomId: string) => void;
  loadingRoomId?: string | null;
  isDeletingRoom?: string | null;
  onClose?: () => void;
}

const getLastMessagePreview = (message: Message | null) => {
  if (!message) return '';
  
  if (message.metadata?.type === 'image') {
    return '🖼️ Image' + (message.metadata.status === 'generating' ? ' (Generating...)' : '');
  }
  
  return message.content || '';
};

export function ChatRoomList({
  rooms,
  selectedRoom,
  onRoomSelect,
  onDeleteRoom,
  loadingRoomId,
  isDeletingRoom,
  onClose
}: ChatRoomListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Mobile Header with Close Button */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0f0f0f] sticky top-0 z-10">
        <h2 className="font-medium text-white/70">Your Chats</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 text-white/70"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <p className="text-sm text-white/50">No chats yet</p>
            <p className="text-xs text-white/30 mt-1">Start a new conversation to begin</p>
          </div>
        ) : (
          <div className="py-2 px-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomSelect(room)}
                disabled={loadingRoomId === room.id}
                className={cn(
                  "w-full text-left p-3.5 rounded-lg mb-2",
                  "flex items-center gap-4",
                  "transition-all duration-200",
                  "group relative",
                  selectedRoom?.id === room.id
                    ? "bg-pink-500/10 hover:bg-pink-500/20"
                    : "hover:bg-white/5",
                  loadingRoomId === room.id && "opacity-50 cursor-wait"
                )}
              >
                {/* AI Avatar */}
                <div className="shrink-0 w-12 h-12 rounded-full overflow-hidden border border-white/10">
                  {room.aiModel?.imageUrl ? (
                    <Image
                      src={room.aiModel.imageUrl}
                      alt={room.aiModel.name || 'AI Avatar'}
                      width={48}
                      height={48}
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
                  )}
                </div>

                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15px] font-medium text-white truncate">
                      {room.aiModel?.name || 'AI Assistant'}
                    </p>
                    {room.messages && room.messages.length > 0 && (
                      <span className="text-xs text-white/30">
                        {new Date(room.messages[0].createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 truncate mt-0.5">
                    {room.messages && room.messages.length > 0
                      ? getLastMessagePreview(room.messages[0])
                      : 'No messages yet'}
                  </p>
                </div>

                {/* Loading State */}
                {loadingRoomId === room.id && (
                  <Loader2 className="shrink-0 w-5 h-5 animate-spin text-white/30" />
                )}

                {/* Delete Button */}
                {onDeleteRoom && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRoom(room.id);
                    }}
                    disabled={isDeletingRoom === room.id}
                    className={cn(
                      "shrink-0 h-8 w-8 rounded-full",
                      "opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-200",
                      "hover:bg-red-500/10 hover:text-red-500",
                      isDeletingRoom === room.id && "opacity-50 cursor-wait"
                    )}
                  >
                    {isDeletingRoom === room.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

