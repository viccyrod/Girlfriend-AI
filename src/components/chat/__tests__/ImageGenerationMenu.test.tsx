import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageGenerationMenu } from '../ImageGenerationMenu';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ jobId: 'test-job', message: { id: 'msg-1' } }),
  })
) as jest.Mock;

// Add at the top after imports
const TEST_TIMEOUTS = {
  IMAGE_GENERATION: 5000,  // Longer timeout for image generation
  IMAGE_POLLING: 2000,     // Matches production polling interval
  NETWORK_OPERATION: 1000, // Standard network operation timeout
  UI_INTERACTION: 500      // Quick UI interactions
} as const;

describe('ImageGenerationMenu', () => {
  const mockChatRoom = {
    id: 'room-1',
    name: 'Test Chat',
    aiModel: {
      id: 'model-1',
      name: 'Test AI',
      imageUrl: '/test.jpg',
      personality: 'Friendly',
      appearance: 'Modern',
      backstory: 'An AI assistant',
      hobbies: 'Helping users',
      likes: 'Conversations',
      dislikes: 'Rudeness',
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
    aiModelImageUrl: '/test.jpg',
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
  };

  const defaultProps = {
    chatRoom: mockChatRoom,
    onClose: jest.fn(),
    setIsLoadingResponse: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders image generation button', () => {
    render(<ImageGenerationMenu {...defaultProps} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('opens dropdown menu on click', async () => {
    render(<ImageGenerationMenu {...defaultProps} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(screen.getByPlaceholderText(/add details/i)).toBeInTheDocument();
    expect(screen.getByText(/show me a photo/i)).toBeInTheDocument();
  });

  it('handles custom prompt input', async () => {
    render(<ImageGenerationMenu {...defaultProps} />);
    
    // Open menu
    await userEvent.click(screen.getByRole('button'));
    
    // Type custom prompt
    const input = screen.getByPlaceholderText(/add details/i);
    await userEvent.type(input, 'wearing a red dress');
    
    expect(input).toHaveValue('wearing a red dress');
  });

  it('handles image generation request', async () => {
    render(<ImageGenerationMenu {...defaultProps} />);
    
    // Open menu
    await userEvent.click(screen.getByRole('button'));
    
    // Add custom prompt
    await userEvent.type(screen.getByPlaceholderText(/add details/i), 'in a garden');
    
    // Click generation option
    await userEvent.click(screen.getByText(/show me a photo/i));
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/image', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('in a garden')
      }));
    });
  });

  it('disables button while generating', async () => {
    render(<ImageGenerationMenu {...defaultProps} />);
    
    // Open menu and start generation
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText(/show me a photo/i));
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  it('handles generation error', async () => {
    // Mock fetch to reject
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to generate'));
    
    render(<ImageGenerationMenu {...defaultProps} />);
    
    // Open menu and attempt generation
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByText(/show me a photo/i));
    
    // Wait for error state
    await waitFor(() => {
      expect(defaultProps.setIsLoadingResponse).toHaveBeenCalledWith(false);
    }, { timeout: TEST_TIMEOUTS.NETWORK_OPERATION });

    // Verify button is re-enabled
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('polls for image status', async () => {
    jest.useFakeTimers();
    
    // Mock successful generation followed by completion
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'test-job', message: { id: 'msg-1' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'COMPLETED',
          message: { 
            id: 'msg-1',
            metadata: { 
              imageUrl: 'test.jpg',
              status: 'completed'
            } 
          }
        })
      });

    render(<ImageGenerationMenu {...defaultProps} />);
    
    // Open menu
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Find and click the first menu item
    const menuItems = screen.getAllByRole('menuitem');
    await userEvent.click(menuItems[0]);
    
    // Advance time by polling interval
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    
    // Verify polling occurred
    const pollCalls = (fetch as jest.Mock).mock.calls.filter(call => 
      call[0].includes('/api/image?jobId=test-job')
    );
    expect(pollCalls.length).toBeGreaterThan(0);
    
    jest.useRealTimers();
  }, 15000);

  it('cleans up polling interval on unmount', async () => {
    jest.useFakeTimers();
    
    // Mock successful generation
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'test-job', message: { id: 'msg-1' } })
      });
    
    const { unmount } = render(<ImageGenerationMenu {...defaultProps} />);
    
    // Open menu
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Find and click the first menu item
    const menuItems = screen.getAllByRole('menuitem');
    await userEvent.click(menuItems[0]);
    
    // Advance time by polling interval
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    
    unmount();
    
    // Advance more time
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });
    
    const pollCalls = (fetch as jest.Mock).mock.calls.filter(call => 
      call[0].includes('/api/image?jobId=test-job')
    );
    expect(pollCalls.length).toBeLessThanOrEqual(1);
    
    jest.useRealTimers();
  }, 15000);

  it('closes menu after successful generation', async () => {
    jest.useFakeTimers();
    
    // Mock successful generation and completion
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'test-job', message: { id: 'msg-1' } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          status: 'COMPLETED',
          message: { 
            id: 'msg-1',
            metadata: { 
              imageUrl: 'test.jpg',
              status: 'completed'
            } 
          }
        })
      });

    render(<ImageGenerationMenu {...defaultProps} />);
    
    // Open menu
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    // Wait for menu to open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Find and click the first menu item
    const menuItems = screen.getAllByRole('menuitem');
    await userEvent.click(menuItems[0]);
    
    // Advance time by polling interval
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    
    // Verify menu closes
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    jest.useRealTimers();
  }, 15000);
}); 