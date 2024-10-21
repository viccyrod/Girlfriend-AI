import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  const { content, aiModelId, chatRoomId } = await request.json();

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

  // Construct prompt with AI model's personality
  const prompt = `You are ${aiModel.name}, an AI with the following characteristics:
    Personality: ${aiModel.personality}
    Appearance: ${aiModel.appearance}
    Backstory: ${aiModel.backstory}
    Hobbies: ${aiModel.hobbies}
    Likes: ${aiModel.likes}
    Dislikes: ${aiModel.dislikes}

    Please respond to the following message in character:
    ${user.name}'s message: ${content}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      stream: true,
    });

    let responseContent = '';
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || "";
      responseContent += content;
    }

    // Save the AI response to the database
    const savedMessage = await prisma.message.create({
      data: {
        content: responseContent,
        chatRoomId: chatRoomId,
        aiModelId: aiModelId,
        isAIMessage: true  // This indicates it's an AI-generated message
      }
    });

    return NextResponse.json(savedMessage);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
  }
}
