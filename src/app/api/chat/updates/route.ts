import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

        // Clean up on connection close
        request.signal.addEventListener('abort', () => {
          clearInterval(pingInterval);
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
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