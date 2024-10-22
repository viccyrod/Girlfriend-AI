// src/app/api/chat/[chatRoomId]/messages/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import OpenAI from "openai";
import { storeMemory } from '@/utils/memory';
import { getEmbedding } from '@/utils/embedding';
import { retrieveMemories } from '@/utils/memory';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  console.log('1. POST request received');
  const { chatRoomId } = params;
  const { content, userId } = await request.json();
  console.log('2. Request parsed:', { chatRoomId, content, userId });

  const currentUser = await getCurrentUser();
  console.log('3. Current user fetched:', currentUser?.id);

  if (!currentUser) {
    console.log('4. User not authenticated');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('5. Creating user message');
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
    console.log('6. User message created:', userMessage.id);

    console.log('7. Fetching chat room');
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { aiModel: true },
    });
    console.log('8. Chat room fetched:', chatRoom?.id);

    if (!chatRoom || !chatRoom.aiModel) {
      console.log('9. Chat room or AI model not found');
      return NextResponse.json({ message: 'Chat room or AI model not found' }, { status: 404 });
    }

    console.log('10. Retrieving relevant memories');
    let relevantMemories: string[] = [];
    try {
      relevantMemories = await retrieveMemories(chatRoom.aiModel.id, currentUser.id, content);
      console.log('Relevant memories retrieved:', relevantMemories);
    } catch (error) {
      console.error('Error retrieving memories:', error);
      // Optionally, you can choose to continue without memories if there's an error
    }

    const memoryContext = relevantMemories.join('\n');

    console.log('11. Constructing prompt with memories');
    const prompt = `Here are some relevant previous interactions:
      ${memoryContext}.
      
      You are ${chatRoom.aiModel.name}, an AI with the following characteristics:
      Personality: ${chatRoom.aiModel.personality}
      Appearance: ${chatRoom.aiModel.appearance}
      Backstory: ${chatRoom.aiModel.backstory}
      Hobbies: ${chatRoom.aiModel.hobbies}
      Likes: ${chatRoom.aiModel.likes}
      Dislikes: ${chatRoom.aiModel.dislikes}
      
      
      
      Please respond to the following message in character, taking into account the previous interactions:
      ${currentUser.name}'s message: ${content}
      
      Respond in a friendly tone, and in a way that is consistent with the AI's personality and previous interactions.`;

    console.log('12. Sending request to OpenAI API');
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: content }
      ],
      max_tokens: 150,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    console.log('14. Saving AI response to database');
    const aiMessage = await prisma.message.create({
      data: {
        content: aiResponse,
        chatRoomId,
        aiModelId: chatRoom.aiModel.id,
        isAIMessage: true,
      },
    });
    console.log('15. AI message saved:', aiMessage.id);

    console.log('16. Storing conversation in long-term memory');
    const conversationText = `User: ${content}\nAI: ${aiResponse}`;
    try {
      await storeMemory(chatRoom.aiModel.id, currentUser.id, conversationText);
      console.log('17. Conversation stored in memory');
    } catch (error) {
      console.error('Error storing conversation in memory:', error);
    }

    console.log('18. Getting embedding');
    const embedding = await getEmbedding(conversationText);
    console.log('19. Embedding received');

    const embeddingString = JSON.stringify(embedding);

    console.log('20. Storing embedding in database');
    await prisma.conversationEmbedding.create({
      data: {
        userId: currentUser.id,
        aiModelId: chatRoom.aiModel.id,
        embedding: embeddingString,
        content: conversationText,
      },
    });
    console.log('21. Embedding stored in database');

    console.log('22. Sending response');
    return NextResponse.json({ userMessage, aiMessage }, { status: 201 });
  } catch (error) {
    console.error('23. Error processing message:', error);
    return NextResponse.json({ 
      message: 'Failed to process message', 
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
}
