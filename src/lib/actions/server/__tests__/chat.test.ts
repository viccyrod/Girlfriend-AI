import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/clients/prisma';
import { messageEmitter } from '@/lib/messageEmitter';
import {
  getOrCreateChatRoomServer,
  createMessageServer,
  deleteChatRoomServer,
  getChatRoomMessagesServer,
} from '../chat';

// Mock dependencies
jest.mock('@/lib/session', () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock('@/lib/clients/prisma', () => {
  const mockPrisma = {
    aIModel: {
      findUnique: jest.fn(),
    },
    chatRoom: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };
  return {
    __esModule: true,
    default: mockPrisma,
  };
});

jest.mock('@/lib/messageEmitter', () => ({
  messageEmitter: {
    emit: jest.fn(),
  },
}));

describe('Chat Server Actions', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@test.com',
  };

  const mockAIModel = {
    id: 'model-1',
    name: 'Test AI',
    createdBy: mockUser,
  };

  const mockChatRoom = {
    id: 'room-1',
    name: 'Test Chat',
    aiModel: mockAIModel,
    users: [mockUser],
    messages: [],
    createdBy: mockUser,
  };

  beforeEach(() => {
    jest.mocked(getCurrentUser).mockResolvedValue(mockUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateChatRoomServer', () => {
    it('returns existing chat room if found', async () => {
      jest.mocked(prisma.aIModel.findUnique).mockResolvedValue(mockAIModel);
      jest.mocked(prisma.chatRoom.findFirst).mockResolvedValue(mockChatRoom);

      const result = await getOrCreateChatRoomServer('model-1');

      expect(result).toEqual(mockChatRoom);
      expect(prisma.chatRoom.create).not.toHaveBeenCalled();
    });

    it('creates new chat room if none exists', async () => {
      jest.mocked(prisma.aIModel.findUnique).mockResolvedValue(mockAIModel);
      jest.mocked(prisma.chatRoom.findFirst).mockResolvedValue(null);
      jest.mocked(prisma.chatRoom.create).mockResolvedValue(mockChatRoom);

      const result = await getOrCreateChatRoomServer('model-1');

      expect(result).toEqual(mockChatRoom);
      expect(prisma.chatRoom.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Chat with Test AI',
            aiModel: { connect: { id: 'model-1' } },
          }),
        })
      );
    });

    it('throws error if user is not authenticated', async () => {
      jest.mocked(getCurrentUser).mockResolvedValue(null);

      await expect(getOrCreateChatRoomServer('model-1')).rejects.toThrow('Unauthorized');
    });
  });

  describe('createMessageServer', () => {
    const mockMessage = {
      id: 'msg-1',
      content: 'Hello',
      chatRoomId: 'room-1',
      user: mockUser,
    };

    beforeEach(() => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      jest.mocked(prisma.chatRoom.findUnique).mockResolvedValue(mockChatRoom);
      jest.mocked(prisma.message.create).mockResolvedValue(mockMessage);
    });

    it('creates a new message', async () => {
      const result = await createMessageServer('room-1', 'user-1', 'Hello');

      expect(result).toEqual(mockMessage);
      expect(prisma.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Hello',
            isAIMessage: false,
          }),
        })
      );
      expect(messageEmitter.emit).toHaveBeenCalledWith('newMessage', {
        message: mockMessage,
        chatRoomId: 'room-1',
      });
    });

    it('marks previous messages as responded when creating AI message', async () => {
      await createMessageServer('room-1', 'user-1', 'Hello', true);

      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: {
          chatRoomId: 'room-1',
          isAIMessage: false,
          hasAIResponded: false,
        },
        data: {
          hasAIResponded: true,
        },
      });
    });

    it('throws error if user not found', async () => {
      jest.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        createMessageServer('room-1', 'user-1', 'Hello')
      ).rejects.toThrow('User not found');
    });

    it('throws error if chat room not found', async () => {
      jest.mocked(prisma.chatRoom.findUnique).mockResolvedValue(null);

      await expect(
        createMessageServer('room-1', 'user-1', 'Hello')
      ).rejects.toThrow('Chat room not found');
    });
  });

  describe('deleteChatRoomServer', () => {
    it('deletes chat room if user has access', async () => {
      jest.mocked(prisma.chatRoom.findUnique).mockResolvedValue(mockChatRoom);

      await deleteChatRoomServer('room-1', 'user-1');

      expect(prisma.chatRoom.delete).toHaveBeenCalledWith({
        where: { id: 'room-1' },
      });
    });

    it('throws error if user does not have access', async () => {
      jest.mocked(prisma.chatRoom.findUnique).mockResolvedValue({
        ...mockChatRoom,
        users: [{ id: 'other-user' }],
      });

      await expect(
        deleteChatRoomServer('room-1', 'user-1')
      ).rejects.toThrow('User does not have access to this chat room');
    });
  });

  describe('getChatRoomMessagesServer', () => {
    const mockMessages = [
      { id: 'msg-1', content: 'Hello', user: mockUser },
      { id: 'msg-2', content: 'Hi', user: mockUser },
    ];

    it('returns all messages for a chat room', async () => {
      jest.mocked(prisma.message.findMany).mockResolvedValue(mockMessages);

      const result = await getChatRoomMessagesServer('room-1');

      expect(result).toEqual(mockMessages);
      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { chatRoomId: 'room-1' },
        include: { user: true },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});
