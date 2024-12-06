import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/session';
import { messageEmitter } from '@/lib/messageEmitter';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatRoomId = params.id;

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue('data: {"connected":true}\n\n');

        // Subscribe to message events for this chat room
        const onMessage = (message: any) => {
          // Send the entire message object
          controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
        };

        // Add listener
        messageEmitter.on(`chat:${chatRoomId}`, onMessage);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          messageEmitter.off(`chat:${chatRoomId}`, onMessage);
          controller.close();
        });
      }
    });

    // Return SSE response
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in SSE setup:', error);
    return NextResponse.json(
      { error: 'Failed to setup SSE connection' },
      { status: 500 }
    );
  }
}
