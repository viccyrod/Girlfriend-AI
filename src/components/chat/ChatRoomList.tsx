import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ExtendedChatRoom } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ExtendedMessage } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

interface ChatRoomListProps {
  chatRooms: ExtendedChatRoom[];
  selectedRoom: ExtendedChatRoom | null;
  onSelectRoom: (room: ExtendedChatRoom) => void;
  onDeleteRoom: (roomId: string) => Promise<void>;
  isLoading: boolean;
  loadingRoomId: string | null;
  className?: string;
}

// Memoized chat room item to prevent unnecessary re-renders
const ChatRoomItem = React.memo(({ 
  room, 
  isSelected,
  isLoading,
  onSelect,
  onDelete,
  showDeleteButton
}: { 
  room: ExtendedChatRoom; 
  isSelected: boolean;
  isLoading: boolean;
  onSelect: () => void;
  onDelete: () => void;
  showDeleteButton: boolean;
}) => {
  const latestMessage = room.messages?.[room.messages.length - 1] as ExtendedMessage | undefined;

  const getMessagePreview = (message?: ExtendedMessage) => {
    if (!message) return 'No messages yet';
    
    if (message.metadata?.type === 'image') {
      return `📸 Photo`;
    }
    
    if (message.metadata?.type === 'voice_message') {
      return `🎤 Voice Message`;
    }

    if (message.content.startsWith('cm2') || /^[a-zA-Z0-9]{20,}$/.test(message.content)) {
      return message.isAIMessage ? 'AI is typing...' : 'Message sent';
    }
    
    return message.isAIMessage 
      ? message.content
      : `You: ${message.content}`;
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 rounded-lg p-4 text-sm transition-colors relative group',
        'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        isSelected ? 'bg-accent' : 'transparent',
        isLoading ? 'opacity-50' : ''
      )}
    >
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage 
          src={room.aiModel?.imageUrl || '/default-avatar.png'} 
          alt={room.aiModel?.name || 'AI'}
          className="object-cover"
        />
        <AvatarFallback>{room.aiModel?.name?.[0] || 'AI'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <p className="font-medium text-foreground truncate">
            {room.aiModel?.name || 'AI Chat'}
          </p>
          {latestMessage && (
            <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
              {format(new Date(latestMessage.createdAt), 'HH:mm')}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate mt-1">
          {getMessagePreview(latestMessage)}
        </p>
      </div>
      {showDeleteButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      )}
    </div>
  );
});

ChatRoomItem.displayName = 'ChatRoomItem';

export function ChatRoomList({
  chatRooms: initialChatRooms,
  selectedRoom,
  onSelectRoom,
  onDeleteRoom,
  isLoading,
  loadingRoomId,
  className
}: ChatRoomListProps) {
  const { toast } = useToast();
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [localChatRooms, setLocalChatRooms] = useState<ExtendedChatRoom[]>(initialChatRooms);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize sorted rooms to prevent unnecessary re-sorting
  const sortedRooms = useMemo(() => {
    return [...localChatRooms].sort((a, b) => {
      const aLatest = a.messages?.[a.messages.length - 1]?.createdAt;
      const bLatest = b.messages?.[b.messages.length - 1]?.createdAt;
      if (!aLatest) return 1;
      if (!bLatest) return -1;
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });
  }, [localChatRooms]);

  // Set up SSE connection for real-time updates
  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);

    const eventSource = new EventSource('/api/chat/rooms/subscribe');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.connected) {
          console.log('Connected to chat rooms SSE');
          return;
        }

        if (data.room) {
          setLocalChatRooms(prevRooms => {
            // Find if room already exists
            const roomIndex = prevRooms.findIndex(r => r.id === data.room.id);
            
            if (roomIndex !== -1) {
              // Update existing room
              const updatedRooms = [...prevRooms];
              updatedRooms[roomIndex] = {
                ...updatedRooms[roomIndex],
                ...data.room,
                messages: data.room.messages || updatedRooms[roomIndex].messages
              };
              return updatedRooms;
            } else {
              // Add new room
              return [...prevRooms, data.room];
            }
          });
        }

        if (data.deletedRoomId) {
          setLocalChatRooms(prevRooms => 
            prevRooms.filter(room => room.id !== data.deletedRoomId)
          );
        }
      } catch (error) {
        console.error('Error handling room update:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Chat rooms SSE error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat room updates. Retrying...",
        variant: "destructive",
      });
    };

    return () => {
      eventSource.close();
    };
  }, [isInitialized, toast]);

  // Update local rooms when initial rooms change
  useEffect(() => {
    setLocalChatRooms(initialChatRooms);
  }, [initialChatRooms]);

  if (isLoading) {
    return <div className="p-4 text-muted-foreground">Loading chat rooms...</div>;
  }

  if (sortedRooms.length === 0) {
    return <div className="p-4 text-muted-foreground">No chat rooms available</div>;
  }

  return (
    <ScrollArea className={cn('h-[calc(100vh-4rem)] px-2', className)}>
      <div className="flex flex-col gap-2 p-2">
        {sortedRooms.map((room) => (
          <ChatRoomItem
            key={room.id}
            room={room}
            isSelected={selectedRoom?.id === room.id}
            isLoading={loadingRoomId === room.id}
            onSelect={() => onSelectRoom(room)}
            onDelete={() => onDeleteRoom(room.id)}
            showDeleteButton={hoveredRoomId === room.id}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

export type { ExtendedChatRoom };

