import { EventEmitter } from 'events';

declare global {
  // Declare a global property on the `globalThis` object
  var _messageEmitter: EventEmitter | undefined;
}

// Initialize `messageEmitter` only if it hasn't been created yet
if (!globalThis._messageEmitter) {
  globalThis._messageEmitter = new EventEmitter();
}

// Export a constant `messageEmitter` with the initialized global event emitter
export const messageEmitter = globalThis._messageEmitter;
