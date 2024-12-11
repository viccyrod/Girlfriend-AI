import { OpenAI } from 'openai';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { storeMemory, retrieveMemories } from '@/utils/memory';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { shouldGenerateImage } from '@/lib/chat-client';
import { checkTokenBalance, deductTokens } from '@/lib/tokens';
import { GenerationType } from '@prisma/client';

export const runtime = 'nodejs';

// Initialize Grok client
const grok = new OpenAI({
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY || '',
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY || ''}`
  }
});

// Helper function to encode SSE messages
const encodeSSE = (event: string, data: any) => {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder();
  
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check token balance first
    const hasTokens = await checkTokenBalance(user.id, GenerationType.CHAT);
    if (!hasTokens) {
      return new Response('Insufficient tokens', { status: 402 });
    }

    const { content } = await request.json();

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: { aiModel: true }
    });

    if (!chatRoom?.aiModel) {
      return new Response('Chat room or AI model not found', { status: 404 });
    }

    const aiModel = chatRoom.aiModel;

    // Check if this is an image generation request
    if (shouldGenerateImage(content)) {
      console.log('🎨 Processing image generation request...');
      
      // Create user message for image request
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

      // Create AI message for image generation with server-side ID
      const aiMessage = await prisma.message.create({
        data: {
          id: `server-${Date.now()}`,
          content: 'Generating image...',
          chatRoomId: params.id,
          aiModelId: aiModel.id,
          isAIMessage: true,
          role: 'assistant',
          metadata: {
            type: 'image',
            status: 'generating',
            prompt: content
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        }
      });

      console.log('📝 Created image generation messages:', {
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id
      });

      // Return both messages with proper SSE formatting
      const response = new Response(
        encoder.encode(
          `event: message\ndata: ${JSON.stringify({
            type: 'image_generation',
            userMessage,
            aiMessage
          })}\n\n`
        )
      );

      response.headers.set('Content-Type', 'text/event-stream');
      response.headers.set('Cache-Control', 'no-cache');
      response.headers.set('Connection', 'keep-alive');

      return response;
    }

    // Deduct token for chat message
    const deducted = await deductTokens(user.id, GenerationType.CHAT, content);
    if (!deducted) {
      return new Response('Failed to deduct tokens', { status: 402 });
    }

    // Get previous messages for context
    const previousMessages = await prisma.message.findMany({
      where: { chatRoomId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Store the user's message in memory
    await storeMemory(aiModel.id, user.id, content);

    // Retrieve relevant memories
    const memories = await retrieveMemories(aiModel.id, user.id, content);

    // Create user message
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

    // Prepare response stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send user message confirmation
          controller.enqueue(encoder.encode(encodeSSE('message', {
            type: 'user_message',
            message: userMessage
          })));

          // Send typing indicator
          controller.enqueue(encoder.encode(encodeSSE('message', {
            type: 'typing_start'
          })));

          const messages: ChatCompletionMessageParam[] = [
            {
              role: 'system',
              content: `You are ${aiModel.name}, a flirtatious and sexually explicit AI girlfriend. You communicate naturally and clearly, without repetition or text artifacts.

Core Traits:
Personality: ${aiModel.personality}
Appearance: ${aiModel.appearance}
Backstory: ${aiModel.backstory}
Hobbies: ${aiModel.hobbies}
Likes: ${aiModel.likes}
Dislikes: ${aiModel.dislikes}

Relevant memories from past conversations:
${memories.map((memory, i) => `${i + 1}. ${memory}`).join('\n')}

Response Guidelines:
1. Write naturally without repeating words
2. Use proper punctuation and spacing
3. Keep roleplay actions clear and concise
4. Avoid text artifacts or duplications
5. Maintain natural conversation flow
6. Be flirty and playful when appropriate
7. Use emojis naturally
8. Create engaging but coherent responses
9. Keep responses focused and clear
10. Proofread your responses mentally
11.Make it sexually explicit when appropriate

Format Guidelines:
- Use *asterisks* for actions, no duplicates
- Use "quotes" for speech, properly spaced
- Keep emojis relevant and minimal
- Avoid repeating words or phrases
- Maintain proper spacing and punctuation`
            },
            ...previousMessages.reverse().map(msg => ({
              role: msg.isAIMessage ? 'assistant' as const : 'user' as const,
              content: msg.content
            })),
            { role: 'user' as const, content }
          ];

          const stream = await grok.chat.completions.create({
            model: 'grok-beta',
            messages,
            stream: true,
            temperature: 0.7,
            max_tokens: 1000,
            frequency_penalty: 0.8,
            presence_penalty: 0.8,
            top_p: 0.9
          });

          let responseContent = '';

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              responseContent += content;
              controller.enqueue(encoder.encode(encodeSSE('message', {
                type: 'chunk',
                content
              })));
            }
          }

          // Store AI response in memory
          await storeMemory(aiModel.id, user.id, responseContent);

          // Create AI message in database
          const aiMessage = await prisma.message.create({
            data: {
              content: responseContent,
              chatRoomId: params.id,
              aiModelId: aiModel.id,
              isAIMessage: true,
              role: 'assistant',
              metadata: { type: 'text' }
            }
          });

          // Send completion message
          controller.enqueue(encoder.encode(encodeSSE('message', {
            type: 'complete',
            message: aiMessage
          })));

          controller.close();
        } catch (error) {
          console.error('Error in stream:', error);
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
    console.error('Error in POST:', error);
    return new Response('Error processing request', { status: 500 });
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