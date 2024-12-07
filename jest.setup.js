require('@testing-library/jest-dom')
require('openai/shims/node')

// Mock EventSource
class MockEventSource {
  constructor(url) {
    this.url = url;
    this.onmessage = null;
    this.onerror = null;
    this.onopen = null;
    this.readyState = 0;
  }

  close() {
    this.readyState = 2;
  }

  // Helper method for tests to simulate receiving messages
  simulateMessage(data) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) });
    }
  }
}

global.EventSource = MockEventSource;

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function Image(props) {
    return <img {...props} data-testid="next-image" />
  }
}))

// Setup intersection observer mock
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation(() => ({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
}));
window.IntersectionObserver = mockIntersectionObserver;

// Mock scrollIntoView and scrollTo
Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(window.HTMLElement.prototype, 'scrollTo', {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  get: function() { return 100; }
});

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  requestData: jest.fn(),
  ondataavailable: jest.fn(),
  state: 'inactive',
};

const MediaRecorderMock = jest.fn().mockImplementation(() => mockMediaRecorder);
MediaRecorderMock.prototype.isTypeSupported = jest.fn().mockReturnValue(true);
global.MediaRecorder = MediaRecorderMock;

// Mock fetch for OpenAI
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Suppress console warnings
const originalError = console.error;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning:')) return;
    originalError.call(console, ...args);
  };
  console.warn = (...args) => {
    if (args[0]?.includes?.('Warning:')) return;
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});