import { EventEmitter } from 'events';
import { Message } from '@prisma/client';

// interface MessageEvents {
//   'chat:*': (message: Message) => void;
// }

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

  emit(event: string, message: Message): boolean {
    console.log(`[MessageEmitter] Emitting event: ${event}`, { messageId: message.id });
    return super.emit(event, message);
  }

  on(event: string, listener: (message: Message) => void): this {
    console.log(`[MessageEmitter] Adding listener for: ${event}`);
    return super.on(event, listener);
  }

  off(event: string, listener: (message: Message) => void): this {
    console.log(`[MessageEmitter] Removing listener for: ${event}`);
    return super.off(event, listener);
  }
}

export const messageEmitter = MessageEmitter.getInstance();
