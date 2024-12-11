import { ExtendedChatRoom } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ChatRoomListProps {
  rooms: ExtendedChatRoom[];
  selectedRoom: ExtendedChatRoom | null;
  onRoomSelect: (room: ExtendedChatRoom) => Promise<void>;
  onDeleteRoom: (roomId: string) => Promise<void>;
  loadingRoomId: string | null;
  isDeletingRoom: string | null;
  isLoading?: boolean;
}

const getLastMessagePreview = (room: ExtendedChatRoom): string => {
  if (!room.messages || room.messages.length === 0) {
    return 'No messages yet';
  }
  const lastMessage = room.messages[0];
  return lastMessage.content || 'Empty message';
};

export function ChatRoomList({
  rooms,
  selectedRoom,
  onRoomSelect,
  onDeleteRoom,
  loadingRoomId,
  isDeletingRoom,
  isLoading = false
}: ChatRoomListProps) {
  console.log('🏠 ChatRoomList: Rendering with rooms:', rooms.length);
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            <p className="text-sm text-muted-foreground">Loading chats...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <p className="font-medium">No chat rooms available</p>
              <p className="text-sm text-muted-foreground">
                Start a new conversation with an AI companion
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {rooms.map((room) => {
              console.log('🏠 ChatRoomList: Rendering room:', room.id, room.aiModel?.name);
              return (
                <div
                  key={room.id}
                  onClick={() => onRoomSelect(room)}
                  role="button"
                  tabIndex={0}
                  aria-disabled={isDeletingRoom === room.id}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onRoomSelect(room);
                    }
                  }}
                  className={cn(
                    "w-full p-3 rounded-xl flex items-center gap-3 relative group transition-all duration-200",
                    "hover:bg-pink-500/10",
                    "focus:outline-none focus:ring-2 focus:ring-pink-500/50",
                    isDeletingRoom === room.id && "opacity-50 cursor-not-allowed pointer-events-none",
                    selectedRoom?.id === room.id && "bg-pink-500/10",
                    "cursor-pointer"
                  )}
                >
                  {/* AI Avatar */}
                  <Avatar className="w-10 h-10 ring-2 ring-pink-500/20 transition-all duration-300 group-hover:ring-pink-500/40">
                    <AvatarImage 
                      src={room.aiModel?.imageUrl || ''} 
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                      {room.aiModel?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {room.aiModel?.name || 'AI Chat'}
                      </h3>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(room.updatedAt), 'HH:mm')}
                      </time>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {room.messages?.[0]?.content || 'Start a conversation...'}
                    </p>
                  </div>

                  {/* Delete Button */}
                  {selectedRoom?.id === room.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRoom(room.id);
                      }}
                      disabled={isDeletingRoom === room.id}
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 hover:bg-pink-500/10 text-pink-500/80 hover:text-pink-500 transition-all duration-200"
                    >
                      {isDeletingRoom === room.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

