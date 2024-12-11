import { OpenAI } from 'openai';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// Initialize Grok client
const grok = new OpenAI({
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY || '',
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY || ''}`
  }
});

// Helper to encode SSE message
function encodeSSE(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder();

  try {
    console.log('🚀 Stream: Starting POST request for chat room:', params.id);
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      console.log('❌ Stream: Unauthorized user');
      return new Response("Unauthorized", { status: 401 });
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: { aiModel: true }
    });

    if (!chatRoom || !chatRoom.aiModel) {
      console.log('❌ Stream: Chat room not found:', params.id);
      return new Response('Chat room not found', { status: 404 });
    }

    console.log('✅ Stream: Found chat room:', chatRoom.id, chatRoom.aiModel.name);
    const { content } = await request.json();

    // Create user message first
    const userMessage = await prisma.message.create({
      data: {
        content,
        chatRoomId: params.id,
        userId: user.id,
        isAIMessage: false,
        role: 'user',
        metadata: { type: 'text' }
      }
    });
    console.log('✅ Stream: Created user message:', userMessage.id);

    // Create stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send user message confirmation
          controller.enqueue(encoder.encode(encodeSSE('message', {
            type: 'user_message',
            message: userMessage
          })));
          console.log('✅ Stream: Sent user message confirmation');

          console.log('🤖 Stream: Starting Grok API call with personality:', chatRoom.aiModel!.personality);
          // Get streaming response from Grok
          const response = await grok.chat.completions.create({
            model: 'grok-beta',
            messages: [
              {
                role: 'system',
                content: chatRoom.aiModel!.personality
              },
              {
                role: 'user',
                content
              }
            ],
            stream: true,
            temperature: 0.7,
            max_tokens: 1000,
            frequency_penalty: 0.6
          });
          console.log('✅ Stream: Grok API connection established');

          let fullContent = '';

          // Send start event
          controller.enqueue(encoder.encode(encodeSSE('message', {
            type: 'start'
          })));
          console.log('✅ Stream: Sent start event');

          // Stream each chunk
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              controller.enqueue(encoder.encode(encodeSSE('message', {
                type: 'chunk',
                content
              })));
            }
          }
          console.log('✅ Stream: Completed streaming chunks');

          // Create AI message in database
          const aiMessage = await prisma.message.create({
            data: {
              content: fullContent,
              chatRoomId: params.id,
              aiModelId: chatRoom.aiModel!.id,
              isAIMessage: true,
              role: 'assistant',
              metadata: { type: 'text' }
            }
          });
          console.log('✅ Stream: Created AI message:', aiMessage.id);

          // Send complete message
          controller.enqueue(encoder.encode(encodeSSE('message', {
            type: 'complete',
            messageId: aiMessage.id,
            content: fullContent
          })));
          console.log('✅ Stream: Sent complete message');

          controller.close();
        } catch (error) {
          console.error('❌ Stream error in controller:', error);
          if (error instanceof Error) {
            console.error('Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
          }
          controller.error(error);
        }
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
    console.error('❌ Stream error in main:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return new Response('Error processing stream', { status: 500 });
  }
}

// GET handler for establishing initial SSE connection
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: { aiModel: true }
    });

    if (!chatRoom || !chatRoom.aiModel) {
      return new Response('Chat room not found', { status: 404 });
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Send initial connection message
        controller.enqueue(encoder.encode(encodeSSE('message', { 
          type: 'connected' 
        })));

        // Set up heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(encodeSSE('message', { 
              type: 'heartbeat' 
            })));
          } catch (e) {
            clearInterval(heartbeat);
          }
        }, 30000);

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(heartbeat);
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
    console.error('Stream error:', error);
    return new Response('Error establishing stream', { status: 500 });
  }
} 