'use strict';

import prisma from "@/lib/clients/prisma";
// Importing necessary modules and functions from external libraries
import { NextResponse } from 'next/server';
// import { generateGreeting, getAIResponse } from '@/lib/clients/xai'; // Using our Grok implementation
// import { retrieveMemories, storeMemory } from '@/utils/memory';
// import { Memory } from '@/types/memory';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { getChatRoomMessagesServer } from '../../serverActions';
import { messageEmitter } from '@/lib/messageEmitter';


// Handles POST requests to create a new message and generate an AI response

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Finding chat room:', params.id, 'for user:', user.id);
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

    console.log('Chat room found:', chatRoom);
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('Creating message with content:', body.content);
    const message = await prisma.message.create({
      data: {
        content: body.content,
        chatRoomId: params.id,
        userId: user.id,
        isAIMessage: false
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

    messageEmitter.emit(`chat:${params.id}`, message);
    return NextResponse.json(message);
  } catch (error) {
    console.error('Error in POST /api/chat/[id]/messages:', error);
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


// Update getChatMessages to be used in GET endpoint
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await getChatRoomMessagesServer(params.id);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: { users: true }
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Verify user has permission to delete this room
    if (!chatRoom.users.some(roomUser => roomUser.id === user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the chat room and all associated messages (using cascade)
    await prisma.chatRoom.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete chat room:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat room' },
      { status: 500 }
    );
  }
}