import { EventEmitter } from 'events';

class MessageEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Increase max listeners if needed
  }
}

export const messageEmitter = new MessageEmitter();
