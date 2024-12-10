import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExtendedChatRoom } from "@/types/chat";
import { Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatRoomListProps {
  chatRooms: ExtendedChatRoom[];
  selectedRoom: ExtendedChatRoom | null;
  onSelectRoom: (room: ExtendedChatRoom) => void;
  onDeleteRoom: (roomId: string) => Promise<void>;
  isLoading: boolean;
  loadingRoomId: string | null;
}

const ChatRoomSkeleton = () => (
  <div className="flex items-center gap-3 p-4 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-muted" />
    <div className="space-y-2 flex-1">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
    </div>
  </div>
);

export function ChatRoomList({
  chatRooms,
  selectedRoom,
  onSelectRoom,
  onDeleteRoom,
  isLoading,
  loadingRoomId,
}: ChatRoomListProps) {
  const handleDeleteRoom = async (roomId: string) => {
    try {
      await onDeleteRoom(roomId);
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  const getLastMessageTime = (room: ExtendedChatRoom) => {
    // Get messages in correct order
    const messages = room.messages || [];
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
    if (!lastMessage) return format(new Date(room.createdAt), 'MMM d');
    
    const messageDate = new Date(lastMessage.createdAt);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();
    return isToday ? format(messageDate, 'HH:mm') : format(messageDate, 'MMM d');
  };

  const getLastMessagePreview = (room: ExtendedChatRoom) => {
    // Get messages in correct order
    const messages = room.messages || [];
    let messageToShow = messages.length > 0 ? messages[messages.length - 1] : null;
    if (!messageToShow) return 'Start a conversation';

    // Skip system messages
    if (messageToShow.content.startsWith('[SYSTEM]')) {
      // If this is the only message, return default text
      if (messages.length === 1) return 'Start a conversation';
      // Otherwise get the previous non-system message
      for (let i = messages.length - 2; i >= 0; i--) {
        if (!messages[i].content.startsWith('[SYSTEM]')) {
          messageToShow = messages[i];
          break;
        }
      }
    }

    // Handle different message types
    if (messageToShow.metadata?.type === 'image') {
      return messageToShow.isAIMessage ? '📸 Sent an image' : 'You: 📸 Image';
    }
    if (messageToShow.metadata?.type === 'voice_message') {
      return messageToShow.isAIMessage ? '🎤 Voice message' : 'You: 🎤 Voice';
    }

    const truncateText = (text: string) => {
      if (text.length <= 25) return text;
      return `${text.slice(0, 25)}...`;
    };

    return messageToShow.isAIMessage 
      ? truncateText(messageToShow.content)
      : `You: ${truncateText(messageToShow.content)}`;
  };

  // Sort rooms by last message time or creation time
  const sortedRooms = [...chatRooms].sort((a, b) => {
    const aMessages = a.messages || [];
    const bMessages = b.messages || [];
    
    const aTime = aMessages.length > 0 
      ? new Date(aMessages[aMessages.length - 1].createdAt).getTime()
      : new Date(a.createdAt).getTime();
      
    const bTime = bMessages.length > 0
      ? new Date(bMessages[bMessages.length - 1].createdAt).getTime()
      : new Date(b.createdAt).getTime();
    
    return bTime - aTime;
  });

  return (
    <div className="flex flex-col h-full bg-background/80 backdrop-blur-md">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => <ChatRoomSkeleton key={i} />)
          ) : sortedRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center space-y-2">
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground">Start chatting with an AI companion</p>
            </div>
          ) : (
            sortedRooms.map((room) => (
              <div
                key={room.id}
                onClick={(e) => {
                  e.preventDefault();
                  onSelectRoom(room);
                }}
                className={cn(
                  "group flex items-center gap-3 p-3 rounded-lg cursor-pointer relative w-full text-left",
                  "hover:bg-primary/5 transition-all duration-200",
                  selectedRoom?.id === room.id && "bg-primary/10"
                )}
              >
                <Avatar className="w-12 h-12 border-2 border-primary/20 flex-shrink-0">
                  <AvatarImage 
                    src={room.aiModel?.imageUrl || ''} 
                    alt={room.aiModel?.name || 'AI'}
                    className="object-cover"
                  />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between w-full">
                    <div className="font-medium truncate max-w-[70%]">
                      {room.aiModel?.name || 'AI Chat'}
                    </div>
                    <div className="text-xs text-muted-foreground flex-shrink-0">
                      {getLastMessageTime(room)}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground truncate mt-0.5">
                    {getLastMessagePreview(room)}
                  </div>
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoom(room.id);
                  }}
                  className={cn(
                    "absolute right-2 p-2 rounded-full transition-all duration-200 cursor-pointer",
                    "opacity-0 group-hover:opacity-100",
                    "hover:bg-destructive/10",
                    loadingRoomId === room.id && "pointer-events-none"
                  )}
                >
                  {loadingRoomId === room.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export type { ExtendedChatRoom };

