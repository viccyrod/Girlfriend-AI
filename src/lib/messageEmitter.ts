import { EventEmitter } from 'events';
import { Message } from '@prisma/client';

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
    console.log(`[MessageEmitter] Emitting event: ${event}`, { message });
    return super.emit(event, { message });
  }

  on(event: string, listener: (data: { message: Message }) => void): this {
    console.log(`[MessageEmitter] Adding listener for: ${event}`);
    return super.on(event, listener);
  }

  off(event: string, listener: (data: { message: Message }) => void): this {
    console.log(`[MessageEmitter] Removing listener for: ${event}`);
    return super.off(event, listener);
  }
}

export const messageEmitter = MessageEmitter.getInstance();
