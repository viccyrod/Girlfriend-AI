import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { messageEmitter } from '@/lib/messageEmitter';
import { Message } from '@prisma/client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'home';

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

        const pingInterval = setInterval(() => {
          const pingMessage = `data: {"type":"ping","timestamp":${Date.now()}}\n\n`;
          controller.enqueue(encoder.encode(pingMessage));
        }, 5000);

        const connectionMessage = `data: {"type":"connection","timestamp":${Date.now()}}\n\n`;
        controller.enqueue(encoder.encode(connectionMessage));

        messageEmitter.on(`chat:${params.id}`, sendMessage);

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
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('SSE Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 