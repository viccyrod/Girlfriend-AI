import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { messageEmitter } from '@/lib/messageEmitter';
import { Message } from '@prisma/client';

export const runtime = 'nodejs';

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

    console.log('Establishing SSE connection for chat room:', params.id);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendMessage = (message: Message) => {
          console.log('Sending SSE message:', message);
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        messageEmitter.on(`chat:${params.id}`, sendMessage);

        // Send initial connection message
        sendMessage({ 
          type: 'connection', 
          status: 'established' 
        } as unknown as Message);

        request.signal.addEventListener('abort', () => {
          console.log('SSE connection aborted');
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
    console.error('Error in SSE handler:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 