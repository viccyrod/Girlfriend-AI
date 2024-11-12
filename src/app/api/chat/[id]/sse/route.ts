import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/lib/clients/prisma';
import { messageEmitter } from '@/lib/messageEmitter';
import { Message } from '@/types/message';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: params.id,
        users: {
          some: {
            id: user.id
          }
        }
      }
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Set up SSE headers
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const messageHandler = (message: Message) => {
          // Ensure message is serializable by converting dates to ISO strings
          const serializedMessage = {
            ...message,
            createdAt: message.createdAt.toISOString(),
            updatedAt: message.updatedAt.toISOString(),
          };
          const data = encoder.encode(`data: ${JSON.stringify(serializedMessage)}\n\n`);
          controller.enqueue(data);
        };

        // Listen for messages for this specific chat room
        messageEmitter.on(`chat:${params.id}`, messageHandler);

        // Clean up when the connection closes
        request.signal.addEventListener('abort', () => {
          messageEmitter.off(`chat:${params.id}`, messageHandler);
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in SSE route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 