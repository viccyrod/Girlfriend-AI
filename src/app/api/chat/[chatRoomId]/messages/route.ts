// src/app/api/chat/[chatRoomId]/messages/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import openai from '@/lib/openai'; // Make sure you have this import set up correctly

export async function GET(request: Request, { params }: { params: { chatRoomId: string } }) {
  const { chatRoomId } = params;

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { chatRoomId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ message: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { chatRoomId: string } }) {
  const { chatRoomId } = params;
  const { content, userId } = await request.json();

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create the user's message
    const userMessage = await prisma.message.create({
      data: {
        content,
        userId,
        chatRoomId,
      },
      include: {
        user: true,
      },
    });

    // Fetch the chat room to get the AI model details
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { aiModel: true },
    });

    if (!chatRoom || !chatRoom.aiModel) {
      return NextResponse.json({ message: 'Chat room or AI model not found' }, { status: 404 });
    }

    // Construct the prompt for the AI
    const prompt = `You are ${chatRoom.aiModel.name}, an AI with the following characteristics:
      Personality: ${chatRoom.aiModel.personality}
      Appearance: ${chatRoom.aiModel.appearance}
      Backstory: ${chatRoom.aiModel.backstory}
      Hobbies: ${chatRoom.aiModel.hobbies}
      Likes: ${chatRoom.aiModel.likes}
      Dislikes: ${chatRoom.aiModel.dislikes}

      Please respond to the following message in character:
      ${currentUser.name}'s message: ${content} in a friendly tone, and in a way that is consistent with the AI's personality.`;

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Save AI response to the database
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        chatRoomId,
        aiModelId: chatRoom.aiModel.id,
        isAIMessage: true,
      },
    });

    return NextResponse.json({ userMessage, aiMessage }, { status: 201 });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json({ message: 'Failed to process message' }, { status: 500 });
  }
}
