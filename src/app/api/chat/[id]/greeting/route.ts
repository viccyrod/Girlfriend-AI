import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDbUser } from "@/lib/actions/server/auth";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const room = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: { aiModel: true }
    });

    if (!room || !room.aiModel) {
      return new NextResponse("Room not found", { status: 404 });
    }

    const { aiModel } = room;
    const systemPrompt = `You are ${aiModel.name}. ${aiModel.personality}. Your appearance: ${aiModel.appearance}. Your backstory: ${aiModel.backstory}. Your hobbies: ${aiModel.hobbies}. You like: ${aiModel.likes}. You dislike: ${aiModel.dislikes}.`;

    // Create initial message
    const message = await prisma.message.create({
      data: {
        content: "",
        role: "assistant",
        chatRoomId: room.id,
        isAIMessage: true,
        metadata: { type: "greeting" },
        aiModelId: room.aiModelId
      }
    });

    // Call grok-beta API with streaming
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: "system", content: systemPrompt },
          { role: "assistant", content: "Greet the user in your unique personality style." }
        ],
        stream: true,
        temperature: 1.0,
        max_tokens: 150,
        presence_penalty: 0.9,
        frequency_penalty: 0.9,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    // Create a transform stream to accumulate content and update the message
    const reader = response.body!.getReader();
    const encoder = new TextEncoder();
    let accumulatedContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices[0]?.delta?.content || '';
                  accumulatedContent += content;

                  // Forward the chunk to the client in SSE format
                  controller.enqueue(encoder.encode(
                    `data: ${JSON.stringify({
                      id: message.id,
                      content: accumulatedContent,
                      chatRoomId: room.id,
                      role: "assistant",
                      isAIMessage: true,
                      aiModelId: room.aiModelId,
                      createdAt: message.createdAt,
                      updatedAt: message.updatedAt,
                      metadata: { type: "greeting" }
                    })}\n\n`
                  ));
                } catch (e) {
                  console.error('Error parsing streaming response:', e);
                }
              }
            }
          }

          // Update the message with final content
          await prisma.message.update({
            where: { id: message.id },
            data: { content: accumulatedContent }
          });

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Greeting error:", error);
    return new NextResponse(
      JSON.stringify({ 
        error: "Internal error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 