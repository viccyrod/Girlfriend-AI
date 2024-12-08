import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { generateGreeting } from '@/lib/ai-client';
import prisma from '@/lib/clients/prisma';
import { messageEmitter } from '@/lib/messageEmitter';
import { AiModel } from '@/types/chat';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Greeting request for room:', params.id);
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.email) {
      console.log('Unauthorized greeting request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat room and AI model details
    console.log('Fetching chat room details');
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: {
        aiModel: {
          select: {
            id: true,
            name: true,
            isPrivate: true,
            imageUrl: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
            personality: true,
            appearance: true,
            backstory: true,
            hobbies: true,
            likes: true,
            dislikes: true,
            isHumanX: true,
            voiceId: true,
            followerCount: true
          }
        }
      }
    });

    if (!chatRoom?.aiModel) {
      console.error('Chat room or AI model not found:', params.id);
      throw new Error('Chat room or AI model not found');
    }

    console.log('Generating greeting for model:', chatRoom.aiModel.name);
    // Generate greeting
    const greeting = await generateGreeting(
      {
        id: chatRoom.aiModel.id,
        userId: chatRoom.aiModel.userId,
        name: chatRoom.aiModel.name,
        personality: chatRoom.aiModel.personality,
        appearance: chatRoom.aiModel.appearance,
        backstory: chatRoom.aiModel.backstory,
        hobbies: chatRoom.aiModel.hobbies,
        likes: chatRoom.aiModel.likes,
        dislikes: chatRoom.aiModel.dislikes,
        imageUrl: chatRoom.aiModel.imageUrl,
        isPrivate: chatRoom.aiModel.isPrivate,
        followerCount: chatRoom.aiModel.followerCount || 0,
        isHumanX: chatRoom.aiModel.isHumanX,
        isAnime: false,
        age: null,
        voiceId: chatRoom.aiModel.voiceId,
        createdAt: new Date(chatRoom.aiModel.createdAt),
        updatedAt: new Date(chatRoom.aiModel.updatedAt)
      } as AiModel,
      [],
      false
    );

    console.log('Creating AI message');
    // Create AI message
    const aiMessage = await prisma.message.create({
      data: {
        content: greeting,
        chatRoomId: params.id,
        isAIMessage: true,
        aiModelId: chatRoom.aiModel.id,
        metadata: {
          type: 'greeting',
          isRead: true
        }
      }
    });

    console.log('Emitting message event');
    // Emit the message event
    messageEmitter.emit(`chat:${params.id}`, { message: aiMessage });

    console.log('Greeting completed successfully');
    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Error in greeting generation:', error);
    return NextResponse.json({ 
      error: 'Failed to generate greeting',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
