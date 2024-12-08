import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import ChatComponent from '../ChatComponent'
import { sendMessage } from '@/lib/actions/chat'
import { ExtendedChatRoom } from '@/types/chat'

// Mock the chat actions
jest.mock('@/lib/actions/chat', () => ({
  sendMessage: jest.fn(),
  subscribeToMessages: jest.fn(),
  getChatRooms: jest.fn().mockResolvedValue([]),
  getOrCreateChatRoom: jest.fn().mockResolvedValue({}),
  deleteChatRoom: jest.fn(),
}))

const mockAiModel = {
  id: 'model-1',
  userId: 'user-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  name: 'Test AI',
  likes: 'testing',
  personality: 'helpful',
  appearance: 'friendly',
  backstory: 'test bot',
  hobbies: 'testing',
  dislikes: 'bugs',
  imageUrl: 'test.jpg',
  voiceId: null,
  isPrivate: false,
  followerCount: 0,
  isFollowing: false,
  isHumanX: false,
  isAnime: false,
  age: null,
  createdBy: {
    id: 'user-1',
    name: 'Test User',
    email: 'test@test.com',
    imageUrl: null
  }
}

const mockCreatedBy = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@test.com',
  imageUrl: null
}

const mockChatRoom: ExtendedChatRoom = {
  id: '1',
  name: 'Test Chat',
  createdAt: new Date(),
  updatedAt: new Date(),
  aiModel: mockAiModel,
  aiModelId: 'model-1',
  aiModelImageUrl: 'test.jpg',
  users: [],
  messages: [],
  createdBy: mockCreatedBy
}

// Add at the top after imports
const TEST_TIMEOUTS = {
  SSE_CONNECTION: 3000,
  MESSAGE_POLLING: 2000,
  NETWORK_OPERATION: 1000,
  UI_INTERACTION: 500
} as const;

// Mock fetch for message loading
const mockMessage = {
  id: '123',
  content: 'Hello',
  userId: '456',
  chatRoomId: mockChatRoom.id,
  createdAt: new Date(),
  updatedAt: new Date(),
  aiModelId: null,
  isAIMessage: false,
  metadata: {},
  role: 'user',
  user: { id: '456', name: 'Test User', image: null }
}

global.fetch = jest.fn((url) => {
  if (url.includes('/messages')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([mockMessage])
    });
  }
  if (url.includes('/api/chat') && url.includes('/send')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: mockMessage })
    });
  }
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
}) as jest.Mock;

// Mock EventSource
interface MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close: () => void;
}

/** @ts-expect-error EventSource mock */
global.EventSource = jest.fn().mockImplementation((url: string) => {
  return {
    onmessage: null,
    onerror: null,
    close: jest.fn(),
  } as MockEventSource;
});

describe('ChatComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders initial state correctly', () => {
    render(<ChatComponent initialChatRoom={mockChatRoom} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('handles message sending', async () => {
    const mockMessage = {
      id: '123',
      content: 'Hello',
      userId: '456',
      chatRoomId: mockChatRoom.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      aiModelId: null,
      isAIMessage: false,
      metadata: {},
      role: 'user',
      user: { id: '456', name: 'Test User', image: null }
    }
    jest.mocked(sendMessage).mockResolvedValueOnce(mockMessage)

    render(<ChatComponent initialChatRoom={mockChatRoom} />)
    
    const input = screen.getByRole('textbox')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } })
    })

    const form = input.closest('form')
    if (!form) throw new Error('Form not found')

    await act(async () => {
      fireEvent.submit(form)
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(
        expect.any(String),
        'Hello',
        expect.any(Object)
      )
    })
  })

  it('shows loading state while sending message', async () => {
    jest.mocked(sendMessage).mockImplementationOnce(() => new Promise(() => {}))

    render(<ChatComponent initialChatRoom={mockChatRoom} />)

    const input = screen.getByRole('textbox')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } })
    })

    const form = input.closest('form')
    if (!form) throw new Error('Form not found')

    await act(async () => {
      fireEvent.submit(form)
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toHaveAttribute('disabled')
  })

  it('handles message send failure', async () => {
    jest.mocked(sendMessage).mockRejectedValueOnce(new Error('Failed to send'))

    render(<ChatComponent initialChatRoom={mockChatRoom} modelId={mockChatRoom.aiModelId} />)
    
    const input = screen.getByRole('textbox')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } })
      await new Promise(resolve => setTimeout(resolve, TEST_TIMEOUTS.UI_INTERACTION))
    })

    const form = input.closest('form')
    if (!form) throw new Error('Form not found')

    await act(async () => {
      fireEvent.submit(form)
      await new Promise(resolve => setTimeout(resolve, TEST_TIMEOUTS.NETWORK_OPERATION))
    })

    const errorMessage = await waitFor(
      () => screen.getByRole('alert'),
      { timeout: TEST_TIMEOUTS.NETWORK_OPERATION }
    )
    expect(errorMessage).toHaveTextContent(/failed to send message/i)
  })

  it('handles image generation requests', () => {
    render(<ChatComponent initialChatRoom={mockChatRoom} />)
    
    const imageButton = screen.getByRole('button', { name: /send image/i })
    expect(imageButton).toBeInTheDocument()
  })

  it('handles voice messages', async () => {
    render(<ChatComponent initialChatRoom={mockChatRoom} />)
    
    // Wait for component to fully render
    await waitFor(() => {
      const voiceButton = screen.getByLabelText(/record voice message/i)
      expect(voiceButton).toBeInTheDocument()
    })
  })

  it('subscribes to messages on mount', async () => {
    const { container } = render(
      <ChatComponent initialChatRoom={mockChatRoom} modelId={mockChatRoom.aiModelId} />
    );
    
    // Wait for initial messages to load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/chat/${mockChatRoom.id}/messages`,
        expect.any(Object)
      );
    });

    // Wait for message content to be displayed
    await waitFor(() => {
      expect(screen.getByText('test message')).toBeInTheDocument();
    });
  }, TEST_TIMEOUTS.SSE_CONNECTION);

  it('unsubscribes from messages on unmount', async () => {
    const { unmount, container } = render(
      <ChatComponent initialChatRoom={mockChatRoom} modelId={mockChatRoom.aiModelId} />
    );

    // Wait for initial messages to load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/chat/${mockChatRoom.id}/messages`,
        expect.any(Object)
      );
    });

    unmount();

    // Verify cleanup
    await waitFor(() => {
      const eventSources = container.querySelectorAll('EventSource');
      expect(eventSources.length).toBe(0);
    });
  }, TEST_TIMEOUTS.SSE_CONNECTION);

  it('displays error message on failed message send', async () => {
    const error = new Error('Failed to send message')
    jest.mocked(sendMessage).mockRejectedValueOnce(error)

    render(<ChatComponent initialChatRoom={mockChatRoom} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Hello' } })

    const form = input.closest('form')
    if (!form) throw new Error('Form not found')

    await act(async () => {
      fireEvent.submit(form)
    })

    // Wait for error message to appear with increased timeout
    const errorMessage = await waitFor(
      () => screen.getByRole('alert'),
      { timeout: TEST_TIMEOUTS.NETWORK_OPERATION }
    )
    expect(errorMessage).toHaveTextContent(/failed to send message/i)
  })

  test('sends message when form is submitted', async () => {
    render(<ChatComponent initialChatRoom={mockChatRoom} modelId="model-1" />)
    
    const input = screen.getByPlaceholderText(/type a message/i)
    const form = screen.getByRole('form')
    
    fireEvent.change(input, { target: { value: 'Hello' } })
    fireEvent.submit(form)
    
    jest.mocked(sendMessage).mockResolvedValueOnce(mockMessage)
    
    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('1', 'Hello')
    })
  })
})