import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { messageEmitter } from '@/lib/messageEmitter';
import { Message } from '@prisma/client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));

        const sendMessage = (message: Message) => {
          try {
            const data = JSON.stringify(message);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (error) {
            console.error('Error sending message:', error);
          }
        };

        // Set up ping interval
        const pingInterval = setInterval(() => {
          controller.enqueue(encoder.encode(`data: {"type":"ping"}\n\n`));
        }, 5000);

        // Subscribe to messages for this chat room
        messageEmitter.on(`chat:${params.id}`, sendMessage);

        // Clean up on connection close
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval);
          messageEmitter.off(`chat:${params.id}`, sendMessage);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });
  } catch (error) {
    console.error('SSE Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 