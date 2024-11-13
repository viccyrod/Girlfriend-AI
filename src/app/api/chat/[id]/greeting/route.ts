import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { generateGreeting } from '@/lib/ai-client';
import { retrieveMemories } from '@/utils/memory';
import prisma from '@/lib/clients/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { aiModel } = body;

    const memories = await retrieveMemories(
      aiModel.id,
      aiModel.id,
      aiModel.userId
    );

    const greeting = await generateGreeting(aiModel, memories, aiModel.isPrivate);

    if (greeting) {
      await prisma.message.create({
        data: {
          content: greeting,
          chatRoomId: params.id,
          isAIMessage: true,
          metadata: { type: 'greeting' }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error generating greeting:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
