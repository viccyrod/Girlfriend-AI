import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { storeMemory, retrieveMemories } from '@/utils/memory';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(
  request: Request,
  { params }: { params: { chatRoomId: string } }
) {
  try {
    const { content, aiModelId } = await request.json();
    const chatRoomId = params.chatRoomId;

    // Fetch the current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Fetch AI model details
    const aiModel = await prisma.aIModel.findUnique({
      where: { id: aiModelId },
    });

    if (!aiModel) {
      return NextResponse.json({ error: 'AI Model not found' }, { status: 404 });
    }

    // Retrieve relevant memories
    const relevantMemories = await retrieveMemories(aiModelId, user.id, content);

    // Construct prompt with AI model's personality and relevant memories
    const prompt = `You are ${aiModel.name}, an AI with the following characteristics:
      Personality: ${aiModel.personality}
      Appearance: ${aiModel.appearance}
      Backstory: ${aiModel.backstory}
      Hobbies: ${aiModel.hobbies}
      Likes: ${aiModel.likes}
      Dislikes: ${aiModel.dislikes}

      Here are some relevant memories from past conversations:
      ${relevantMemories.join('\n')}

      Please respond to the following message in character:
      ${user.name}'s message: ${content}.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    const responseContent = completion.choices[0]?.message?.content || '';

    // Save the AI response to the database
    const savedMessage = await prisma.message.create({
      data: {
        content: responseContent,
        chatRoomId: chatRoomId,
        aiModelId: aiModelId,
        isAIMessage: true
      }
    });

    // Store the conversation in long-term memory
    await storeMemory(aiModelId, user.id, `User: ${content}\nAI: ${responseContent}`);

    return NextResponse.json(savedMessage);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

