import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
// import { navigateToChatRoom } from '@/app/api/chat/clientActions';
import { format } from 'date-fns';
import { ExtendedMessage, ExtendedChatRoom } from '@/types/chat';

interface ChatRoomListProps {
  isLoading: boolean;
  loadingRoomId: string | null;
  chatRooms: ExtendedChatRoom[];
  selectedRoom: ExtendedChatRoom | null;
  onSelectRoom: (room: ExtendedChatRoom) => void;
  onDeleteRoom: (roomId: string) => Promise<void>;
}

export function ChatRoomList({ 
  chatRooms, 
  selectedRoom, 
  onSelectRoom, 
  onDeleteRoom, 
  isLoading, 
  loadingRoomId 
}: ChatRoomListProps) {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading chat rooms...</div>;
  }

  const getMessagePreview = (message?: ExtendedMessage) => {
    if (!message) return 'No messages yet';
    return message.isAIMessage 
      ? `${message.aiModelId || 'AI'}: ${message.content}` 
      : `You: ${message.content}`;
  };

  return (
    <div className="border-r border-border h-full w-80 overflow-hidden">
      <div className="h-full overflow-y-auto">
        <ul className="divide-y divide-border">
          {chatRooms.length === 0 ? (
            <li className="p-4 text-muted-foreground">No chat rooms available</li>
          ) : (
            chatRooms.map((room) => {
              const latestMessage = room.messages?.[0];
              
              return (
                <li
                  key={room.id}
                  className={`p-4 cursor-pointer hover:bg-muted ${
                    selectedRoom?.id === room.id ? 'bg-muted' : ''
                  } relative group ${loadingRoomId === room.id ? 'opacity-50' : ''}`}
                  onMouseEnter={() => setHoveredRoomId(room.id)}
                  onMouseLeave={() => setHoveredRoomId(null)}
                  onClick={() => onSelectRoom(room)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage 
                        src={room.aiModel?.imageUrl || '/default-avatar.png'} 
                        alt={room.aiModel?.name || 'AI'} 
                      />
                      <AvatarFallback>{room.aiModel?.name?.[0] || 'AI'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium text-foreground truncate">
                          {room.aiModel?.name || 'AI Chat'}
                        </p>
                        {latestMessage && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(latestMessage.createdAt), 'HH:mm')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {getMessagePreview(latestMessage as ExtendedMessage)}
                      </p>
                    </div>
                  </div>
                  
                  {hoveredRoomId === room.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRoom(room.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

export type { ExtendedChatRoom };
