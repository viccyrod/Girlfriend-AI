import { EventEmitter } from 'events';

class MessageEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  emit(event: string | symbol, ...args: any[]): boolean {
    console.log(`MessageEmitter: Emitting event ${String(event)}`);
    return super.emit(event, ...args);
  }

  on(event: string | symbol, listener: (...args: any[]) => void): this {
    console.log(`MessageEmitter: Adding listener for ${String(event)}`);
    return super.on(event, listener);
  }

  off(event: string | symbol, listener: (...args: any[]) => void): this {
    console.log(`MessageEmitter: Removing listener for ${String(event)}`);
    return super.off(event, listener);
  }
}

export const messageEmitter = new MessageEmitter();
