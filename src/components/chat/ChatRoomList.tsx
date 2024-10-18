import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChatRoom, User, Message, AIModel } from '@prisma/client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface ExtendedChatRoom extends ChatRoom {
  users: User[];
  messages: Message[] | undefined;
  aiModel: AIModel | null;
}
// Extending the ChatRoom interface to include users, messages, and an AI model.

interface ChatRoomListProps {
  chatRooms: ExtendedChatRoom[];
  selectedRoom: ExtendedChatRoom | null;
  onSelectRoom: (room: ExtendedChatRoom) => void;
  onDeleteRoom: (roomId: string) => void;
}
// Defining the props expected by the ChatRoomList component:
// - chatRooms: an array of ExtendedChatRoom objects (rooms with users, messages, and an AI model).
// - selectedRoom: the currently selected chat room (or null if none selected).
// - onSelectRoom: a function triggered when a room is selected.

export function ChatRoomList({ chatRooms, selectedRoom, onSelectRoom, onDeleteRoom }: ChatRoomListProps) { // Main functional component to render the list of chat rooms.
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  
  return (
<div className="w-64 border-r bg-background flex flex-col h-screen">
  {/* Sidebar container with fixed width (64 units), right border, and full height. */}
  
  <h2 className="text-xl font-bold p-4 text-foreground">Chat Rooms</h2>
  
  <ul className="overflow-y-auto flex-grow">
    {/* Apply flex-grow to make the chat room list take up the remaining space. */}
    
    {chatRooms.map((room) => {
      const aiUser = room.users.find(user => user.isAI);
      const aiModel = room.aiModel;
      const lastMessage = room.messages?.[0];
      
      // Log each room's AI information for debugging
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
              <AvatarImage className="w-10 h-10 cover object-cover" src={aiModel?.imageUrl || aiUser?.image} alt={aiModel?.name || aiUser?.name} />
              <AvatarFallback>{aiModel?.name?.[0] || aiUser?.name?.[0] || '?'}</AvatarFallback>
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
