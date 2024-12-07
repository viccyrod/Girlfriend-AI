import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getCurrentUser } from '@/lib/session';
import { messageEmitter } from '@/lib/messageEmitter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
    const encoder = new TextEncoder();

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = encoder.encode('data: {"connected":true}\n\n');
        controller.enqueue(initialMessage);

        // Subscribe to message events for this chat room
        const onMessage = (message: any) => {
          try {
            // Ensure message is properly stringified and encoded
            const data = encoder.encode(`data: ${JSON.stringify(message)}\n\n`);
            controller.enqueue(data);
          } catch (error) {
            console.error('Error sending message:', error);
          }
        };

        // Add listener with error handling
        messageEmitter.on(`chat:${chatRoomId}`, onMessage);
        console.log(`[SSE] Subscribed to chat:${chatRoomId}`);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          messageEmitter.off(`chat:${chatRoomId}`, onMessage);
          controller.close();
          console.log(`[SSE] Unsubscribed from chat:${chatRoomId}`);
        });
      }
    });

    // Return SSE response with proper headers
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Content-Encoding': 'none'
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
