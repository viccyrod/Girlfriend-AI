import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/db/prisma';
import openai from '@/lib/openai';

export async function POST(request: Request) {
  const { chatRoomId, message } = await request.json();

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { users: true, aiModel: true },
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    const aiModel = chatRoom.aiModel;
    if (!aiModel) {
      return NextResponse.json({ error: 'AI model not found for this chat room' }, { status: 404 });
    }

    const prompt = `You are ${aiModel.name}, an AI with the following characteristics:
      Personality: ${aiModel.personality}
      Appearance: ${aiModel.appearance}
      Backstory: ${aiModel.backstory}
      Hobbies: ${aiModel.hobbies}
      Likes: ${aiModel.likes}
      Dislikes: ${aiModel.dislikes}

      Please respond to the following message in character:
      ${currentUser.name}'s message: ${message}`;

    const stream = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error in streaming AI response:', error);
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
  }
}

