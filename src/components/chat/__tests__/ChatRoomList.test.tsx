import { render, screen, fireEvent } from '@testing-library/react';
import { ChatRoomList } from '../ChatRoomList';
import { format } from 'date-fns';
import type { Message } from '@/types/chat';

describe('ChatRoomList', () => {
  const mockMessage: Message = {
    id: 'msg-1',
    content: 'Hello!',
    isAIMessage: false,
    createdAt: new Date('2024-01-01T12:00:00'),
    metadata: { type: 'text' },
    role: 'user',
    user: {
      id: 'user-1',
      name: 'Test User',
      image: null
    },
    aiModelId: null,
    chatRoomId: 'room-1',
    updatedAt: new Date('2024-01-01T12:00:00')
  };

  const mockChatRooms = [
    {
      id: 'room-1',
      name: 'Chat with Sofia',
      aiModel: {
        id: 'model-1',
        name: 'Sofia',
        imageUrl: '/sofia.jpg',
        personality: 'Friendly and outgoing',
        appearance: 'Elegant and sophisticated',
        backstory: 'A virtual companion',
        hobbies: 'Art and music',
        likes: 'Deep conversations',
        dislikes: 'Negativity',
        isPrivate: false,
        followerCount: 0,
        isFollowing: false,
        isHumanX: false,
        isAnime: false,
        age: null,
        voiceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        createdBy: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          imageUrl: null
        }
      },
      aiModelId: 'model-1',
      aiModelImageUrl: '/sofia.jpg',
      users: [],
      messages: [mockMessage],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        imageUrl: null
      }
    },
    {
      id: 'room-2',
      name: 'Chat with Luna',
      aiModel: {
        id: 'model-2',
        name: 'Luna',
        imageUrl: '/luna.jpg',
        personality: 'Creative and artistic',
        appearance: 'Modern and stylish',
        backstory: 'An AI artist',
        hobbies: 'Digital art',
        likes: 'Innovation',
        dislikes: 'Conformity',
        isPrivate: false,
        followerCount: 0,
        isFollowing: false,
        isHumanX: false,
        isAnime: false,
        age: null,
        voiceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'user-1',
        createdBy: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
          imageUrl: null
        }
      },
      aiModelId: 'model-2',
      aiModelImageUrl: '/luna.jpg',
      users: [],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        imageUrl: null
      }
    }
  ];

  const defaultProps = {
    chatRooms: mockChatRooms,
    selectedRoom: null,
    onSelectRoom: jest.fn(),
    onDeleteRoom: jest.fn(),
    loadingRoomId: null,
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chat rooms list', () => {
    render(<ChatRoomList {...defaultProps} />);
    
    expect(screen.getByText('Sofia')).toBeInTheDocument();
    expect(screen.getByText('Luna')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ChatRoomList {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/loading chat rooms/i)).toBeInTheDocument();
  });

  it('shows empty state when no rooms', () => {
    render(<ChatRoomList {...defaultProps} chatRooms={[]} />);
    expect(screen.getByText(/no chat rooms available/i)).toBeInTheDocument();
  });

  it('handles room selection', () => {
    const onSelectRoom = jest.fn();
    render(<ChatRoomList {...defaultProps} onSelectRoom={onSelectRoom} />);
    
    fireEvent.click(screen.getByText('Sofia'));
    expect(onSelectRoom).toHaveBeenCalledWith(mockChatRooms[0]);
  });

  it('shows delete button on hover', async () => {
    const onDeleteRoom = jest.fn();
    render(<ChatRoomList {...defaultProps} onDeleteRoom={onDeleteRoom} />);
    
    const roomElement = screen.getByText('Sofia').closest('li');
    if (!roomElement) throw new Error('Room element not found');
    
    fireEvent.mouseEnter(roomElement);
    
    const deleteButton = await screen.findByRole('button');
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.click(deleteButton);
    expect(onDeleteRoom).toHaveBeenCalledWith('room-1');
  });

  it('displays latest message preview', () => {
    render(<ChatRoomList {...defaultProps} />);
    expect(screen.getByText('You: Hello!')).toBeInTheDocument();
  });

  it('shows correct time format', () => {
    render(<ChatRoomList {...defaultProps} />);
    const time = format(new Date('2024-01-01T12:00:00'), 'HH:mm');
    expect(screen.getByText(time)).toBeInTheDocument();
  });

  it('handles loading state for specific room', () => {
    render(<ChatRoomList {...defaultProps} loadingRoomId="room-1" />);
    const roomElement = screen.getByText('Sofia').closest('li');
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
    
    render(<ChatRoomList {...defaultProps} chatRooms={roomsWithImage} />);
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
    
    render(<ChatRoomList {...defaultProps} chatRooms={roomsWithVoice} />);
    expect(screen.getByText('🎤 Voice Message')).toBeInTheDocument();
  });

  it('highlights selected room', () => {
    render(<ChatRoomList {...defaultProps} selectedRoom={mockChatRooms[0]} />);
    const roomElement = screen.getByText('Sofia').closest('li');
    expect(roomElement).toHaveClass('bg-muted');
  });
}); 