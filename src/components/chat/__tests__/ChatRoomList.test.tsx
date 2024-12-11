import { render, screen, fireEvent } from '@testing-library/react';
import ChatRoomList from '../ChatRoomList';
import { ExtendedChatRoom } from '@/types/chat';
import { Message } from '@/types/message';

const mockMessage: Message = {
  id: 'msg-1',
  content: 'Hello',
  userId: 'user-1',
  isAIMessage: false,
  createdAt: new Date(),
  metadata: { type: 'text' },
  role: 'user',
  user: { id: 'user-1', name: 'Test User', image: null },
  aiModelId: null,
  chatRoomId: 'room-1',
  updatedAt: new Date()
};

const mockChatRooms: ExtendedChatRoom[] = [{
  id: 'room-1',
  name: 'Test Room',
  aiModel: {
    id: 'model-1',
    name: 'Test Model',
    imageUrl: 'test.jpg',
    personality: 'test',
    appearance: 'test',
    backstory: 'test',
    hobbies: 'test',
    likes: 'test',
    dislikes: 'test',
    isPrivate: false,
    age: 25,
    messageCount: 0,
    imageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-1',
    voiceId: null,
    followerCount: 0,
    isAnime: false,
    isHumanX: false,
    status: 'COMPLETED',
    createdBy: {
      id: 'user-1',
      name: 'Test User',
      image: null
    }
  },
  messages: [mockMessage],
  users: [{ id: 'user-1', name: 'Test User', image: null }],
  createdAt: new Date(),
  updatedAt: new Date(),
  aiModelId: 'model-1',
  createdById: 'user-1',
  createdBy: {
    id: 'user-1',
    name: 'Test User',
    image: null
  }
}];

const defaultProps = {
  rooms: mockChatRooms,
  onRoomSelect: jest.fn(),
  isDeletingRoom: false
};

describe('ChatRoomList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat rooms list', () => {
    render(<ChatRoomList {...defaultProps} />);
    
    expect(screen.getByText('Test Room')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ChatRoomList {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/loading chat rooms/i)).toBeInTheDocument();
  });

  it('shows empty state when no rooms', () => {
    render(<ChatRoomList {...defaultProps} rooms={[]} />);
    expect(screen.getByText(/no chat rooms available/i)).toBeInTheDocument();
  });

  it('handles room selection', () => {
    const onSelectRoom = jest.fn();
    render(<ChatRoomList {...defaultProps} onRoomSelect={onSelectRoom} />);
    
    fireEvent.click(screen.getByText('Test Room'));
    expect(onSelectRoom).toHaveBeenCalledWith(mockChatRooms[0]);
  });

  it('shows delete button on hover', async () => {
    const onDeleteRoom = jest.fn();
    render(<ChatRoomList {...defaultProps} onDeleteRoom={onDeleteRoom} />);
    
    const roomElement = screen.getByText('Test Room').closest('li');
    if (!roomElement) throw new Error('Room element not found');
    
    fireEvent.mouseEnter(roomElement);
    
    const deleteButton = await screen.findByRole('button');
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.click(deleteButton);
    expect(onDeleteRoom).toHaveBeenCalledWith('room-1');
  });

  it('displays latest message preview', () => {
    render(<ChatRoomList {...defaultProps} />);
    expect(screen.getByText('You: Hello')).toBeInTheDocument();
  });

  it('shows correct time format', () => {
    render(<ChatRoomList {...defaultProps} />);
    const time = new Date().toLocaleTimeString();
    expect(screen.getByText(time)).toBeInTheDocument();
  });

  it('handles loading state for specific room', () => {
    render(<ChatRoomList {...defaultProps} loadingRoomId="room-1" />);
    const roomElement = screen.getByText('Test Room').closest('li');
    expect(roomElement).toHaveClass('opacity-50');
  });

  it('displays image message preview correctly', () => {
    const imageMessage: Message = {
      ...mockMessage,
      content: '',
      metadata: { type: 'image' }
    };

    const roomsWithImage = [{
      ...mockChatRooms[0],
      messages: [imageMessage]
    }];
    
    render(<ChatRoomList {...defaultProps} rooms={roomsWithImage} />);
    expect(screen.getByText('📸 Photo')).toBeInTheDocument();
  });

  it('displays voice message preview correctly', () => {
    const voiceMessage: Message = {
      ...mockMessage,
      content: '',
      metadata: { type: 'voice_message' }
    };

    const roomsWithVoice = [{
      ...mockChatRooms[0],
      messages: [voiceMessage]
    }];
    
    render(<ChatRoomList {...defaultProps} rooms={roomsWithVoice} />);
    expect(screen.getByText('🎤 Voice Message')).toBeInTheDocument();
  });

  it('highlights selected room', () => {
    render(<ChatRoomList {...defaultProps} selectedRoom={mockChatRooms[0]} />);
    const roomElement = screen.getByText('Test Room').closest('li');
    expect(roomElement).toHaveClass('bg-muted');
  });
}); 