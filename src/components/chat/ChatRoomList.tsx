import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SimplifiedChatRoom } from '@/types/chat';

// Update the component props type
interface ChatRoomListProps {
  chatRooms: SimplifiedChatRoom[];
  selectedRoom: SimplifiedChatRoom | null;
  onSelectRoom: (room: SimplifiedChatRoom) => void;
}

export default function ChatRoomList({ chatRooms, selectedRoom, onSelectRoom }: ChatRoomListProps) {
  return (
    <div className="w-64 border-r overflow-y-auto bg-background">
      <h2 className="text-xl font-bold p-4 text-foreground">Chat Rooms</h2>
      <ul>
        {chatRooms.map((room) => (
          <li
            key={room.id}
            className={`p-4 cursor-pointer hover:bg-muted ${
              selectedRoom?.id === room.id ? 'bg-muted' : ''
            }`}
            onClick={() => onSelectRoom(room)}
          >
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src="/user-placeholder.png" />
                <AvatarFallback>{room.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{room.name}</p>
                {/* Remove or adjust any references to users or messages */}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
