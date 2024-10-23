import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Message, AIModel } from '@prisma/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';


// Export the ExtendedChatRoom type
export type ExtendedChatRoom = {
  id: string;  // Add this line
  users: User[];
  messages: Message[] | undefined;
  aiModel: AIModel | null;
  aiModelId: string;
  aiModelImageUrl: string | null;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
};

interface ChatRoomListProps {
  chatRooms: ExtendedChatRoom[];
  selectedRoom: ExtendedChatRoom | null;
  onSelectRoom: (room: ExtendedChatRoom) => void;
  onDeleteRoom: (roomId: string) => void;
  isLoading: boolean; // Add this line
}

export function ChatRoomList({ chatRooms, selectedRoom, onSelectRoom, onDeleteRoom, isLoading }: ChatRoomListProps) {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  
  if (isLoading) {
    return (
      <div className="w-64 border-r bg-background flex flex-col h-screen">
        <h2 className="text-xl font-bold p-4 text-foreground">Chat Rooms</h2>
        <ul className="overflow-y-auto flex-grow">
          {[...Array(5)].map((_, index) => (
            <li key={index} className="p-4 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col h-screen">
      <h2 className="text-xl font-bold p-4 text-foreground">Chat Rooms</h2>
      <ul className="overflow-y-auto flex-grow">
        {chatRooms.map((room) => {
          const aiUser = room.users.find(user => user.isAI);
          const aiModel = room.aiModel;
          const lastMessage = room.messages?.[0];
          
          console.log('Room AI info:', { aiUser, aiModel });

          return (
            <li
              key={room.id}
              className={`p-4 cursor-pointer hover:bg-muted ${
                selectedRoom?.id === room.id ? 'bg-muted' : ''
              } relative`}
              onMouseEnter={() => setHoveredRoomId(room.id)}
              onMouseLeave={() => setHoveredRoomId(null)}
              onClick={() => onSelectRoom(room)}
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage 
                    className="w-10 h-10 cover object-cover" 
                    src={aiModel?.imageUrl ?? aiUser?.image ?? ''} 
                    alt={aiModel?.name ?? aiUser?.name ?? ''} 
                  />
                  <AvatarFallback>{aiModel?.name?.[0] ?? aiUser?.name?.[0] ?? '?'}</AvatarFallback>
                </Avatar>
                <div className="overflow-hidden">
                  <p className="font-medium text-foreground truncate">{(aiModel?.name?.split(' ')[0] || 'Unknown AI')}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {lastMessage ? lastMessage.content : 'No messages yet'}
                  </p>
                </div>
              </div>
              {hoveredRoomId === room.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRoom(room.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
