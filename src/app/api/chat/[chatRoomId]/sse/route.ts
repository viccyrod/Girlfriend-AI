import { NextResponse } from 'next/server';
import { Message } from '@prisma/client';
import { chatEmitter } from '@/lib/chatEmitter';

export async function GET(request: Request, { params }: { params: { chatRoomId: string } }) {
  const { chatRoomId } = params;

  const stream = new ReadableStream({
    start(controller) {
      const listener = (message: Message) => {
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
