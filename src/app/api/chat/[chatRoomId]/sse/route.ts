import { NextResponse } from 'next/server';
import { EventEmitter } from 'events';

const chatEmitter = new EventEmitter();

export async function GET(request: Request, { params }: { params: { chatRoomId: string } }) {
  const { chatRoomId } = params;

  const stream = new ReadableStream({
    start(controller) {
      const listener = (message: any) => {
        if (message.chatRoomId === chatRoomId) {
          controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
        }
      };

      chatEmitter.on('newMessage', listener);

      return () => {
        chatEmitter.off('newMessage', listener);
      };
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// This is just to make the chatEmitter available for other parts of your application
export { chatEmitter };
