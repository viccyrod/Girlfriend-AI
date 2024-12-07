import { render, screen, fireEvent } from '@testing-library/react'
import { VoiceMessage } from '../VoiceMessage'

describe('VoiceMessage', () => {
  const mockMediaRecorder = {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    requestData: jest.fn(),
    ondataavailable: jest.fn(),
    state: 'inactive',
  }

  beforeEach(() => {
    // Mock getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{
            stop: jest.fn()
          }]
        })
      },
      configurable: true
    })
    const MediaRecorderMock = jest.fn().mockImplementation(() => mockMediaRecorder)
    MediaRecorderMock.prototype.isTypeSupported = jest.fn().mockReturnValue(true)
    global.MediaRecorder = MediaRecorderMock as any
  })

  it('renders record button', () => {
    const mockSetIsRecording = jest.fn()
    render(
      <VoiceMessage 
        onVoiceMessage={jest.fn()} 
        isRecording={false}
        setIsRecording={mockSetIsRecording}
      />
    )
    expect(screen.getByRole('button', { name: /record voice message/i })).toBeInTheDocument()
  })

  // Add more tests as needed...
})