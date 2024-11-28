// Importing necessary modules and functions from external libraries
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/clients/prisma';
import { getOpenAIClient } from '@/lib/clients/openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Handles POST requests to generate and stream an AI response for a chat message
export async function POST(request: Request) {
  // Extract the chat room ID and user message from the request body
  const { chatRoomId, message } = await request.json();

  // Fetch the current user to ensure they are authenticated
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    // If the user is not authenticated, return a 401 Unauthorized response
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch the chat room details, including the users and the associated AI model
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { users: true, aiModel: true },
    });

    // If the chat room is not found, return a 404 Not Found response
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Ensure the AI model for the chat room is available
    const aiModel = chatRoom.aiModel;
    if (!aiModel) {
      return NextResponse.json({ error: 'AI model not found for this chat room' }, { status: 404 });
    }

    // Get recent messages for context
    const recentMessages = await prisma.message.findMany({
      where: {
        chatRoomId: chatRoomId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        content: true,
        isAIMessage: true,
        createdAt: true
      }
    });

    // Format messages for context
    const messageHistory: ChatCompletionMessageParam[] = recentMessages.reverse().map(msg => ({
      role: msg.isAIMessage ? "assistant" as const : "user" as const,
      content: msg.content
    }));

    // Create the system message with AI characteristics
    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: `You are ${aiModel.name}, an AI with the following characteristics:
        Personality: ${aiModel.personality}
        Appearance: ${aiModel.appearance}
        Backstory: ${aiModel.backstory}
        Hobbies: ${aiModel.hobbies}
        Likes: ${aiModel.likes}
        Dislikes: ${aiModel.dislikes}`
    };

    // Create stream with full context
    const openAIClient = getOpenAIClient();
    if (!openAIClient) {
      return NextResponse.json({ error: 'OpenAI client not initialized' }, { status: 500 });
    }

    const stream = await openAIClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        systemMessage,
        ...messageHistory,
        { role: "user" as const, content: message }
      ],
      stream: true,
      temperature: 0.9,
      max_tokens: 100,
    });

    // Set up a readable stream to return the AI response in chunks
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream!) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    // Return the response stream with appropriate headers for streaming
    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Error in streaming AI response:', error);
    // If an error occurs during message processing, return a 500 Internal Server Error response
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 });
  }
}

// This code defines an API endpoint for generating and streaming an AI response for a chat room in a real-time conversational system.
// Here is a step-by-step explanation of what the code does:
// 1. The `POST` function handles incoming POST requests.
// 2. It extracts the `chatRoomId` and `message` from the request body to determine which chat room the message belongs to and the content of the user's message.
// 3. The `getCurrentUser()` function is called to fetch the current logged-in user.
//    - If the user is not authenticated, it returns a 401 Unauthorized response.
// 4. It then fetches the chat room details using the `chatRoomId`, including the users and the associated AI model.
//    - If the chat room is not found or the AI model is missing, it returns a 404 Not Found response.
// 5. A prompt is created for the AI model based on the AI's characteristics and the user's message.
//    - The prompt includes details like personality, appearance, backstory, hobbies, likes, and dislikes of the AI character.
// 6. The OpenAI API is called to generate a response using the GPT-4 model.
//    - The response is streamed back to the client, allowing real-time updates.
// 7. A `ReadableStream` is created to read and enqueue the response chunks generated by OpenAI.
// 8. The API then returns a stream response with appropriate headers (`Content-Type` set to `text/plain` and `Transfer-Encoding` set to `chunked`) to allow for a real-time conversation experience.
// 9. If an error occurs at any point in the process, the error is logged, and a 500 Internal Server Error response is returned.
