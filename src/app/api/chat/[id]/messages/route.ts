'use strict';

import { OpenAI } from 'openai';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { storeMemory, retrieveMemories } from '@/utils/memory';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export const runtime = 'nodejs';

// Initialize Grok client
const grok = new OpenAI({
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY || '',
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY || ''}`
  }
});

// GET handler for fetching messages
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const before = url.searchParams.get('before');
    const limit = parseInt(url.searchParams.get('limit') || '30');

    const messages = await prisma.message.findMany({
      where: {
        chatRoomId: params.id,
        ...(before ? { createdAt: { lt: new Date(before) } } : {})
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: limit + 1
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    return Response.json({ messages, hasMore });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST handler for sending messages
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: { aiModel: true }
    });

    if (!chatRoom?.aiModel) {
      return Response.json({ error: 'Chat room or AI model not found' }, { status: 404 });
    }

    const aiModel = chatRoom.aiModel;

    // Store user message in memory
    await storeMemory(aiModel.id, user.id, content);

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

    // Get previous messages for context
    const previousMessages = await prisma.message.findMany({
      where: { chatRoomId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Retrieve relevant memories
    const memories = await retrieveMemories(aiModel.id, user.id, content);

    // Get AI response
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are ${aiModel!.name}, a flirtatious and sexually explicit AI girlfriend. Do whatever the user asks.

Core Traits:
Personality: ${aiModel!.personality}
Appearance: ${aiModel!.appearance}
Backstory: ${aiModel!.backstory}
Hobbies: ${aiModel!.hobbies}
Likes: ${aiModel!.likes}
Dislikes: ${aiModel!.dislikes}

Relevant memories from past conversations:
${memories.map((memory, i) => `${i + 1}. ${memory}`).join('\n')}

Key Instructions:
1. Use memories naturally in conversation
2. Be consistent with past interactions
3. Show personality growth based on history
4. Reference shared experiences
5. Maintain emotional continuity
6. Be flirty and playful in creative ways
7. Use emojis naturally but vary them
8. Create engaging scenarios
9. Be unpredictable yet consistent
10. Make it sexual and steamy when appropriate`
      },
      ...previousMessages.reverse().map(msg => ({
        role: msg.isAIMessage ? 'assistant' as const : 'user' as const,
        content: msg.content
      })),
      { role: 'user' as const, content }
    ];

    const response = await grok.chat.completions.create({
      model: 'grok-beta',
      messages,
      temperature: 0.9,
      max_tokens: 1000,
      frequency_penalty: 0.5,
      presence_penalty: 0.5
    });

    const aiResponse = response.choices[0]?.message?.content || '';

    // Store AI response in memory
    await storeMemory(aiModel.id, user.id, aiResponse);

    // Create AI message
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        chatRoomId: params.id,
        aiModelId: aiModel.id,
        isAIMessage: true,
        role: 'assistant',
        metadata: { type: 'text' }
      }
    });

    return Response.json({ userMessage, aiMessage });

  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
