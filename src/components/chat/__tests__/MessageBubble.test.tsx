import { render, screen } from '@testing-library/react'
import { MessageBubble } from '../MessageBubble'
import type { Message } from '@/types/message'

const mockUser = {
  id: 'user-1',
  name: 'Test User',
  image: null,
  isSubscribed: true,
  customerId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  isAI: false,
  bio: null,
  email: 'test@example.com'
}

const mockUserMessage: Message = {
  id: '1',
  content: 'Hello!',
  role: 'user',
  metadata: { type: 'text' },
  createdAt: new Date('2024-01-01T20:21:00'),
  updatedAt: new Date(),
  chatRoomId: '1',
  userId: 'user-1',
  user: {
    id: 'user-1',
    name: 'Test User',
    image: null
  },
  aiModelId: null,
  isAIMessage: false
}

const mockAIMessage: Message = {
  id: '2',
  content: 'Hi there!',
  role: 'assistant',
  metadata: { type: 'text' },
  createdAt: new Date('2024-01-01T20:21:00'),
  updatedAt: new Date(),
  chatRoomId: '1',
  userId: null,
  user: null,
  aiModelId: 'model-1',
  isAIMessage: true
}

describe('MessageBubble', () => {
  it('renders user message correctly', () => {
    render(
      <MessageBubble 
        message={mockUserMessage} 
        modelImage={null}
        isRead={false}
        isLastMessage={false}
      />
    )
    
    expect(screen.getByText('Hello!')).toBeInTheDocument()
    expect(screen.getByText('20:21')).toBeInTheDocument()
  })

  it('renders AI message correctly', () => {
    render(
      <MessageBubble 
        message={mockAIMessage}
        modelImage="/test-image.jpg"
        isRead={true}
        isLastMessage={true}
      />
    )
    
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('displays message timestamp', () => {
    render(
      <MessageBubble 
        message={mockUserMessage}
        modelImage={null}
        isRead={false}
        isLastMessage={false}
      />
    )
    
    expect(screen.getByText('20:21')).toBeInTheDocument()
  })

  it('handles messages with image metadata', () => {
    const messageWithImage: Message = {
      ...mockAIMessage,
      metadata: { 
        type: 'image', 
        imageUrl: 'test-image.jpg',
        prompt: 'A beautiful sunset'
      }
    }
    
    render(
      <MessageBubble 
        message={messageWithImage}
        modelImage="/test-image.jpg"
        isRead={true}
        isLastMessage={true}
      />
    )
    
    expect(screen.getByText('Generating image...')).toBeInTheDocument()
  })

  it('handles messages with voice metadata', () => {
    const messageWithVoice: Message = {
      ...mockAIMessage,
      metadata: { 
        type: 'voice', 
        audioUrl: 'test-audio.mp3' 
      }
    }
    
    render(
      <MessageBubble 
        message={messageWithVoice}
        modelImage="/test-image.jpg"
        isRead={true}
        isLastMessage={true}
      />
    )
    
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('applies correct styling for user messages', () => {
    const { container } = render(
      <MessageBubble 
        message={mockUserMessage}
        modelImage={null}
        isRead={false}
        isLastMessage={false}
      />
    )
    
    const messageContainer = container.firstChild as HTMLElement
    expect(messageContainer.className).toContain('flex-row-reverse')
  })

  it('applies correct styling for AI messages', () => {
    const { container } = render(
      <MessageBubble 
        message={mockAIMessage}
        modelImage="/test-image.jpg"
        isRead={true}
        isLastMessage={true}
      />
    )
    
    const messageContainer = container.firstChild as HTMLElement
    expect(messageContainer.className).not.toContain('flex-row-reverse')
  })

  it('handles long messages with proper wrapping', () => {
    const longMessage: Message = {
      ...mockUserMessage,
      content: 'This is a very long message that should wrap properly when displayed in the chat interface'
    }
    
    render(
      <MessageBubble 
        message={longMessage}
        modelImage={null}
        isRead={false}
        isLastMessage={false}
      />
    )
    
    const messageContent = screen.getByText(longMessage.content)
    expect(messageContent.className).toContain('break-words')
  })
}) 