import { getDbUser } from '@/lib/actions/server/auth';
import prisma from '@/lib/clients/prisma';
import { messageEmitter } from '@/lib/messageEmitter';
import {
  getOrCreateChatRoom,
  sendMessage,
  deleteChatRoom,
  getChatRoomMessages,
} from '../chat';

// Mock dependencies
jest.mock('@/lib/actions/server/auth', () => ({
  getDbUser: jest.fn(),
}));

jest.mock('@/lib/clients/prisma', () => ({
  chatRoom: {
    findFirst: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
  },
}));

jest.mock('@/lib/messageEmitter', () => ({
  messageEmitter: {
    emit: jest.fn(),
  },
}));

// Test data
const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
};

const mockChatRoom = {
  id: 'room-1',
  name: 'Test Room',
  aiModelId: 'model-1',
  users: [mockUser],
  messages: [],
};

describe('Chat Server Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getDbUser).mockResolvedValue(mockUser);
  });

  describe('getOrCreateChatRoom', () => {
    it('throws error if user is not authenticated', async () => {
      jest.mocked(getDbUser).mockResolvedValue(null);

      await expect(getOrCreateChatRoom('model-1')).rejects.toThrow('Unauthorized');
    });

    it('returns existing chat room if found', async () => {
      jest.mocked(prisma.chatRoom.findFirst).mockResolvedValue(mockChatRoom);

      const result = await getOrCreateChatRoom('model-1');
      expect(result).toEqual(mockChatRoom);
    });

    it('creates new chat room if not found', async () => {
      jest.mocked(prisma.chatRoom.findFirst).mockResolvedValue(null);
      jest.mocked(prisma.chatRoom.create).mockResolvedValue(mockChatRoom);

      const result = await getOrCreateChatRoom('model-1');
      expect(result).toEqual(mockChatRoom);
    });
  });
});
