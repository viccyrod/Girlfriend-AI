import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { messageEmitter } from '@/lib/messageEmitter';
import { Message } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const preferredRegion = 'home';
export const fetchCache = 'force-no-store';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.email) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            email: user.email
          }
        }
      }
    });

    if (!chatRoom) {
      return new Response('Chat room not found', { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendMessage = (message: Message) => {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        const pingInterval = setInterval(() => {
          const pingMessage = `data: {"type":"ping","timestamp":"${Date.now()}"}\n\n`;
          controller.enqueue(encoder.encode(pingMessage));
        }, 15000);

        messageEmitter.on(`chat:${params.id}`, sendMessage);

        sendMessage({ 
          type: 'connection', 
          status: 'established',
          timestamp: Date.now()
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
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': '*'
      }
    });
  } catch (error) {
    console.error('SSE Error:', error);
    return new Response('Internal Server Error', { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }
} 