import { EventEmitter } from 'events';

// Create a singleton event emitter instance for message handling
const messageEmitter = new EventEmitter();

export { messageEmitter };
