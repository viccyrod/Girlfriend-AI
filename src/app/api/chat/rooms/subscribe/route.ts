import { NextRequest } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { messageEmitter, EmitData } from '@/lib/messageEmitter';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
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

        // Subscribe to room updates for this user
        messageEmitter.on(`rooms:${user.id}`, sendMessage);
        console.log(`[SSE] Subscribed to rooms:${user.id}`);

        // Clean up on connection close
        req.signal.addEventListener('abort', () => {
          clearInterval(pingInterval);
          messageEmitter.off(`rooms:${user.id}`, sendMessage);
          controller.close();
          console.log(`[SSE] Unsubscribed from rooms:${user.id}`);
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