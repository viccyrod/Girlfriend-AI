import { render, screen } from '@testing-library/react'
import { ChatImageMessage } from '../ChatImageMessage'
import type { Message } from '@/types/message'

describe('ChatImageMessage', () => {
  const mockMessage: Message = {
    id: '1',
    content: '',
    role: 'assistant',
    metadata: {
      type: 'image',
      imageUrl: 'test-image.jpg',
      prompt: 'A beautiful sunset',
      status: 'completed'
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    chatRoomId: '1',
    userId: 'user-1',
    user: null,
    aiModelId: 'model-1',
    isAIMessage: true
  }

  it('renders image with correct source when loading is complete', () => {
    render(<ChatImageMessage message={mockMessage} />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('src', 'test-image.jpg')
    expect(image).toHaveAttribute('alt', 'A beautiful sunset')
  })

  it('displays image prompt', () => {
    render(<ChatImageMessage message={mockMessage} />)
    
    expect(screen.getByText('A beautiful sunset')).toBeInTheDocument()
  })

  it('shows loading state while generating', () => {
    const loadingMessage = {
      ...mockMessage,
      metadata: {
        ...mockMessage.metadata,
        status: 'generating'
      }
    }
    render(<ChatImageMessage message={loadingMessage} />)
    
    expect(screen.getByText(/generating image/i)).toBeInTheDocument()
  })

  it('handles image load error', () => {
    const errorMessage = {
      ...mockMessage,
      metadata: {
        ...mockMessage.metadata,
        status: 'error'
      }
    }
    render(<ChatImageMessage message={errorMessage} />)
    
    expect(screen.getByText(/failed to generate image/i)).toBeInTheDocument()
  })

  it('handles messages without prompt', () => {
    const messageWithoutPrompt = {
      ...mockMessage,
      metadata: {
        ...mockMessage.metadata,
        prompt: undefined
      }
    }
    render(<ChatImageMessage message={messageWithoutPrompt} />)
    
    const image = screen.getByTestId('next-image')
    expect(image).toHaveAttribute('alt', 'AI generated image')
  })
}) 