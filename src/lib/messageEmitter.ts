import { EventEmitter } from 'events';
import { Message } from '@prisma/client';
import { ExtendedChatRoom } from '@/types/chat';

type MessageData = {
  message: Message & {
    user?: {
      id: string;
      name: string | null;
      image: string | null;
    } | null;
  };
};

type RoomData = {
  room: ExtendedChatRoom;
};

type DeleteData = {
  deletedRoomId: string;
};

type EmitData = MessageData | RoomData | DeleteData;

class MessageEmitter extends EventEmitter {
  private static instance: MessageEmitter;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  public static getInstance(): MessageEmitter {
    if (!MessageEmitter.instance) {
      MessageEmitter.instance = new MessageEmitter();
    }
    return MessageEmitter.instance;
  }

  emit(event: string, data: EmitData): boolean {
    console.log(`[MessageEmitter] Emitting event: ${event}`, { data });
    return super.emit(event, data);
  }

  on(event: string, listener: (data: EmitData) => void): this {
    console.log(`[MessageEmitter] Adding listener for: ${event}`);
    return super.on(event, listener);
  }

  off(event: string, listener: (data: EmitData) => void): this {
    console.log(`[MessageEmitter] Removing listener for: ${event}`);
    return super.off(event, listener);
  }
}

export const messageEmitter = MessageEmitter.getInstance();
export type { EmitData, MessageData, RoomData, DeleteData };
