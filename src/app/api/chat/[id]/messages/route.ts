'use strict';

import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { generateAIResponse } from '@/lib/ai-client';
import { 
  getChatRoomMessagesServer, 
  createMessageServer
} from '@/lib/actions/server/chat';
import { messageEmitter } from '@/lib/messageEmitter';
import prisma from '@/lib/clients/prisma';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import type { Message } from '@/lib/ai-client';

export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching messages for chat room:', params.id);
    const messages = await getChatRoomMessagesServer(params.id);
    console.log('Found messages:', messages.length);
    
    // Transform messages to ensure consistent format
    const transformedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      role: message.isAIMessage ? 'assistant' : 'user',
      metadata: message.metadata || {},
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      chatRoomId: message.chatRoomId,
      userId: message.userId,
      user: message.user,
      aiModelId: message.aiModelId,
      isAIMessage: message.isAIMessage
    }));
    
    return NextResponse.json(transformedMessages);
  } catch (error) {
    console.error('Error in GET /api/chat/[id]/messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();
    
    if (!kindeUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, type = 'text', audioData } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    console.log('Creating message for chat room:', params.id);
    
    // Find or create user
    let dbUser = await prisma.user.findUnique({
      where: { id: kindeUser.id }
    });

    if (!dbUser && kindeUser.email) {
      dbUser = await prisma.user.findUnique({
        where: { email: kindeUser.email }
      });

      if (dbUser && dbUser.id !== kindeUser.id) {
        dbUser = await prisma.user.update({
          where: { email: kindeUser.email },
          data: { id: kindeUser.id }
        });
      }
    }

    if (!dbUser && kindeUser.email) {
      dbUser = await prisma.user.create({
        data: {
          id: kindeUser.id,
          email: kindeUser.email,
          name: kindeUser.given_name || kindeUser.family_name || 'Anonymous',
          image: kindeUser.picture || null
        }
      });
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(dbUser.id);
    if (!rateLimit.success) {
      const resetTime = Math.ceil((rateLimit.reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${resetTime} seconds.` },
        { status: 429 }
      );
    }

    // Create user message
    const message = await createMessageServer(params.id, dbUser.id, content);
    console.log('Created user message:', message.id);
    
    // Emit user message with full message object
    messageEmitter.emit(`chat:${params.id}`, message);

    // Get chat room for context
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: {
        aiModel: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: true }
        }
      }
    });

    if (!chatRoom?.aiModel) {
      throw new Error('Chat room or AI model not found');
    }

    // Transform messages for AI response
    const transformedMessages = chatRoom.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.isAIMessage ? 'assistant' : 'user',
      metadata: {
        type: (msg.metadata as any)?.type || 'text',
        imageUrl: (msg.metadata as any)?.imageUrl,
        prompt: (msg.metadata as any)?.prompt
      },
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      chatRoomId: msg.chatRoomId,
      userId: msg.userId,
      isAIMessage: msg.isAIMessage,
      aiModelId: msg.aiModelId,
      user: msg.user
    }));

    // Generate AI response
    console.log('Generating AI response');
    const aiResponse = await generateAIResponse(
      content,
      chatRoom.aiModel,
      transformedMessages.map(msg => msg.content).reverse(),
      transformedMessages,
      'creative'
    );

    if (aiResponse?.content) {
      console.log('Creating AI message');
      const aiMessage = await createMessageServer(
        params.id,
        dbUser.id,
        aiResponse.content,
        true
      );
      console.log('Created AI message:', aiMessage.id);
      // Emit AI message with full message object
      messageEmitter.emit(`chat:${params.id}`, aiMessage);
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in POST /api/chat/[id]/messages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send message' },
      { status: 500 }
    );
  }
}
