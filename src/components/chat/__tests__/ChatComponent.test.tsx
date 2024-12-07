import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import ChatComponent from '../ChatComponent'
import { sendMessage, subscribeToMessages, getChatRooms, getOrCreateChatRoom, deleteChatRoom } from '@/lib/actions/chat'
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

describe('ChatComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders initial state correctly', () => {
    render(<ChatComponent initialChatRoom={mockChatRoom} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('handles message sending', async () => {
    const mockMessage = { content: 'Hello' }
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

    render(<ChatComponent initialChatRoom={mockChatRoom} />)

    const input = screen.getByRole('textbox')
    await act(async () => {
      fireEvent.change(input, { target: { value: 'Hello' } })
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    const form = input.closest('form')
    if (!form) throw new Error('Form not found')

    await act(async () => {
      fireEvent.submit(form)
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    // Wait for error message to appear
    const errorMessage = await waitFor(() => screen.findByRole('alert'))
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
    render(<ChatComponent initialChatRoom={mockChatRoom} />)
    
    await waitFor(() => {
      expect(subscribeToMessages).toHaveBeenCalledWith(
        mockChatRoom.id,
        expect.any(Function)
      )
    })
  })

  it('unsubscribes from messages on unmount', async () => {
    const unsubscribe = jest.fn()
    jest.mocked(subscribeToMessages).mockReturnValueOnce(unsubscribe)

    const { unmount } = render(
      <ChatComponent initialChatRoom={mockChatRoom} />
    )

    await waitFor(() => {
      expect(subscribeToMessages).toHaveBeenCalled()
    })

    unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })

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
      { timeout: 2000 }
    )
    expect(errorMessage).toHaveTextContent(/failed to send message/i)
  })
})