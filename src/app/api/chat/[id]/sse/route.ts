import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { messageEmitter } from '@/lib/messageEmitter';
import { Message } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

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
        const sendMessage = (message: Message) => {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        // Keep-alive ping every 15 seconds instead of 30
        const pingInterval = setInterval(() => {
          const pingMessage = `data: {"type":"ping"}\n\n`;
          controller.enqueue(encoder.encode(pingMessage));
        }, 15000);

        messageEmitter.on(`chat:${params.id}`, sendMessage);

        // Send initial connection message
        sendMessage({ 
          type: 'connection', 
          status: 'established' 
        } as unknown as Message);

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
        'X-Accel-Buffering': 'no',
        // Add CORS headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Credentials': 'true'
      }
    });
  } catch (error) {
    console.error('Error in SSE handler:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 