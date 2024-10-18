import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// Importing Avatar components for displaying user images or fallbacks.

import { ChatRoom, User, Message } from '@prisma/client';
// Importing Prisma models for ChatRoom, User, and Message from the database schema.

interface ExtendedChatRoom extends ChatRoom {
  users: User[];
  messages: Message[] | undefined;
}
// Extending the ChatRoom interface to include users and messages. 
// The messages array is optional and might be undefined.

interface ChatRoomListProps {
  chatRooms: ExtendedChatRoom[];
  selectedRoom: ExtendedChatRoom | null;
  onSelectRoom: (room: ExtendedChatRoom) => void;
}
// Defining the props expected by the ChatRoomList component:
// - chatRooms: an array of ExtendedChatRoom objects (rooms with users and messages).
// - selectedRoom: the currently selected chat room (or null if none selected).
// - onSelectRoom: a function triggered when a room is selected.

export default function ChatRoomList({ chatRooms, selectedRoom, onSelectRoom }: ChatRoomListProps) {
  // Main functional component to render the list of chat rooms.

  return (
<div className="w-64 border-r bg-background flex flex-col h-full">
  {/* Sidebar container with fixed width (64 units), right border, and full height. */}
  
  <h2 className="text-xl font-bold p-4 text-foreground">Chat Rooms</h2>
  
  <ul className="overflow-y-auto max-h-screen">
    {/* Apply max-h-screen to limit the height of the chat room list to the screen height. */}
    
    {chatRooms.map((room) => {
      const otherUser = room.users.find(user => user.name !== 'You') || room.users[0];
      
      return (
        <li
          key={room.id}
          className={`p-4 cursor-pointer hover:bg-muted ${
            selectedRoom?.id === room.id ? 'bg-muted' : ''
          }`}
          onClick={() => onSelectRoom(room)}
        >
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={otherUser?.image ?? undefined} />
              <AvatarFallback>{otherUser?.name?.[0] ?? '?'}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <p className="font-medium text-foreground truncate">{otherUser?.name || 'Unknown User'}</p>
              <p className="text-sm text-muted-foreground truncate">
                {room.messages && room.messages.length > 0 ? room.messages[0].content : 'No messages yet'}
              </p>
            </div>
          </div>
        </li>
      );
    })}
  </ul>
    </div>
    
  );
}
