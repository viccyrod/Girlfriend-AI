import { NextRequest } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { messageEmitter, EmitData } from '@/lib/messageEmitter';
import { z } from 'zod';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Validate route parameters
const RouteParamsSchema = z.object({
  id: z.string().min(1)
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate route parameters
    const validatedParams = RouteParamsSchema.safeParse(params);
    if (!validatedParams.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid route parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(encoder.encode('data: {"connected":true}\n\n'));

        // Setup keepalive ping
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode('data: {"ping":true}\n\n'));
          } catch (error) {
            console.error('Error sending ping:', error);
          }
        }, 30000); // Send ping every 30 seconds

        // Message handler
        const sendMessage = (data: EmitData) => {
          try {
            const messageData = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
            controller.enqueue(messageData);
          } catch (error) {
            console.error('Error sending message:', error);
            // Send error message to client
            const errorData = encoder.encode(`data: {"error": "Failed to process message"}\n\n`);
            controller.enqueue(errorData);
          }
        };

        // Subscribe to messages
        messageEmitter.on(`chat:${params.id}`, sendMessage);
        console.log(`[SSE] Subscribed to chat:${params.id}`);

        // Clean up on connection close
        req.signal.addEventListener('abort', () => {
          clearInterval(pingInterval);
          messageEmitter.off(`chat:${params.id}`, sendMessage);
          controller.close();
          console.log(`[SSE] Unsubscribed from chat:${params.id}`);
        });
      }
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Content-Encoding': 'none'
      }
    });
  } catch (error) {
    console.error('Error in SSE setup:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to setup SSE connection' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
