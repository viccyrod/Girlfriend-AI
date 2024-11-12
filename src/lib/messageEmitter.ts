import { EventEmitter } from 'events';

declare global {
  var messageEmitter: EventEmitter | undefined;
}

if (!global.messageEmitter) {
  global.messageEmitter = new EventEmitter();
}

export const messageEmitter = global.messageEmitter; 