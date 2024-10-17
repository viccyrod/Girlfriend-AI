import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ChatRoomList({ chatRooms, selectedRoom, onSelectRoom }) {
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
                <AvatarImage src={room.users[0]?.image} />
                <AvatarFallback>{room.users[0]?.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{room.name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {room.messages[0]?.content || 'No messages yet'}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
