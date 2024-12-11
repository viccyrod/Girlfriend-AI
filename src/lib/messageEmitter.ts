import { Message } from '@prisma/client';
import { EventEmitter } from 'events';

export interface EmitData {
  chatRoomId: string;
  message: Message;
}

class MessageEmitter extends EventEmitter {
  emitMessage(chatRoomId: string, message: Message) {
    this.emit('message', { chatRoomId, message });
  }
}

export const messageEmitter = new MessageEmitter();
