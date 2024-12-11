'use strict';

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

    if (!chatRoom || !chatRoom.aiModel) {
      return Response.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Create user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        chatRoomId: params.id,
        userId: user.id,
        isAIMessage: false,
        role: 'user'
      }
    });

    // Get AI response
    const response = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: chatRoom.aiModel.personality
        },
        {
          role: 'user',
          content
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      frequency_penalty: 0.6
    });

    // Create AI message
    const aiMessage = await prisma.message.create({
      data: {
        content: response.choices[0]?.message?.content || '',
        chatRoomId: params.id,
        aiModelId: chatRoom.aiModel.id,
        isAIMessage: true,
        role: 'assistant'
      }
    });

    return Response.json({ userMessage, aiMessage });

  } catch (error) {
    console.error('Error sending message:', error);
    return Response.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
