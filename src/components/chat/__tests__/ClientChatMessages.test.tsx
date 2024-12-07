/// <reference types="jest" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ClientChatMessages from '../ClientChatMessages'

// Mock the chat actions
jest.mock('@/lib/actions/chat', () => ({
  sendMessage: jest.fn(),
  getChatRoomMessages: jest.fn(),
  generateImage: jest.fn(),
  subscribeToMessages: jest.fn(() => () => {}),
}))

const mockChatRoom = {
  id: '1',
  name: 'Test Chat',
  messages: [],
  aiModelId: 'test-model',
  aiModelImageUrl: '/test-image.png',
  aiModel: {
    id: 'test-model',
    name: 'Test AI',
    imageUrl: '/test-image.png',
    userId: 'test-user',
    personality: 'friendly',
    appearance: 'robot',
    backstory: 'A test AI',
    hobbies: 'testing',
    likes: 'tests',
    dislikes: 'bugs',
    isPrivate: false,
    followerCount: 0,
    isAnime: false,
    isHumanX: false,
    isFollowing: false,
    age: null,
    voiceId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  users: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: 'test-user',
  createdBy: {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    image: null
  }
}

// Mock fetch for message loading
const mockMessage = {
  id: 'msg-1',
  content: 'test message',
  isAIMessage: true,
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  chatRoomId: '1',
  userId: 'user-1',
  aiModelId: 'model-1',
  role: 'assistant'
};

global.fetch = jest.fn((url) => {
  if (url.includes('/messages')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([mockMessage])
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
}) as jest.Mock;

// Mock EventSource
class MockEventSource {
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  close = jest.fn();

  constructor(url: string) {
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: JSON.stringify(mockMessage) });
      }
    }, 0);
  }
}

// @ts-ignore
global.EventSource = MockEventSource;

describe('ClientChatMessages', () => {
  const defaultProps = {
    chatRoom: mockChatRoom,
    onSendMessage: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    isGeneratingResponse: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the chat interface', () => {
    render(<ClientChatMessages {...defaultProps} />)
    
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('handles sending a message', async () => {
    const mockOnSendMessage = jest.fn().mockResolvedValue(undefined)
    
    render(
      <ClientChatMessages
        {...defaultProps}
        onSendMessage={mockOnSendMessage}
      />
    )
    
    const input = screen.getByPlaceholderText('Type a message...')
    const sendButton = screen.getByRole('button', { name: /send message/i })
    
    await userEvent.type(input, 'Hello, world!')
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(input).toHaveValue('')
      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello, world!')
    })
  })

  it('shows loading state when generating response', () => {
    render(
      <ClientChatMessages
        {...defaultProps}
        isGeneratingResponse={true}
      />
    )
    
    const typingIndicator = screen.getByTestId('typing-indicator')
    expect(typingIndicator).toBeInTheDocument()
  })

  it('disables send button while loading', () => {
    render(
      <ClientChatMessages
        {...defaultProps}
        isLoading={true}
      />
    )
    
    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toBeDisabled()
  })

  it('handles Enter key to send message', async () => {
    const mockOnSendMessage = jest.fn().mockResolvedValue(undefined)
    
    render(
      <ClientChatMessages
        {...defaultProps}
        onSendMessage={mockOnSendMessage}
      />
    )
    
    const input = screen.getByPlaceholderText('Type a message...')
    
    await userEvent.type(input, 'Hello{Enter}')
    
    await waitFor(() => {
      expect(input).toHaveValue('')
      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello')
    })
  })

  it('prevents sending empty messages', async () => {
    const mockOnSendMessage = jest.fn().mockResolvedValue(undefined)
    
    render(
      <ClientChatMessages
        {...defaultProps}
        onSendMessage={mockOnSendMessage}
      />
    )
    
    const sendButton = screen.getByRole('button', { name: /send message/i })
    fireEvent.click(sendButton)
    
    expect(mockOnSendMessage).not.toHaveBeenCalled()
  })

  it('trims whitespace from messages', async () => {
    const mockOnSendMessage = jest.fn().mockResolvedValue(undefined)
    
    render(
      <ClientChatMessages
        {...defaultProps}
        onSendMessage={mockOnSendMessage}
      />
    )
    
    const input = screen.getByPlaceholderText('Type a message...')
    await userEvent.type(input, '   Hello World!   ')
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    
    await waitFor(() => {
      expect(mockOnSendMessage).toHaveBeenCalledWith('Hello World!')
    })
  })

  it('handles message input change', async () => {
    render(<ClientChatMessages {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Type a message...')
    await userEvent.type(input, 'Test message')
    
    expect(input).toHaveValue('Test message')
  })

  it('clears input after sending message', async () => {
    render(<ClientChatMessages {...defaultProps} />)
    
    const input = screen.getByPlaceholderText('Type a message...')
    await userEvent.type(input, 'Test message')
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    
    await waitFor(() => {
      expect(input).toHaveValue('')
    })
  })

  it('shows error message when sending fails', async () => {
    const mockOnSendMessage = jest.fn().mockRejectedValue(new Error('Failed to send'))
    
    render(
      <ClientChatMessages
        {...defaultProps}
        onSendMessage={mockOnSendMessage}
      />
    )
    
    const input = screen.getByPlaceholderText('Type a message...')
    await userEvent.type(input, 'Test message')
    fireEvent.click(screen.getByRole('button', { name: /send message/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to send message')
    })
  })

  it('loads and displays messages', async () => {
    render(<ClientChatMessages {...defaultProps} />);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/chat/${mockChatRoom.id}/messages`,
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('test message')).toBeInTheDocument();
    });
  });
})