import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

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

    // Set up SSE headers
    const headers = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Initial connection message
        controller.enqueue(encoder.encode('event: connected\ndata: Connected to SSE\n\n'));

        // Set up message polling
        const interval = setInterval(async () => {
          const messages = await prisma.message.findMany({
            where: {
              chatRoomId: params.id,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          });

          if (messages.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(messages[0])}\n\n`)
            );
          }
        }, 1000);

        // Cleanup on close
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error('SSE Error:', error);
    return NextResponse.json({ error: 'SSE Failed' }, { status: 500 });
  }
} 