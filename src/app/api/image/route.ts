import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import prisma from '@/lib/clients/prisma';
import { messageEmitter } from '@/lib/messageEmitter';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, chatRoomId, style = 'realistic' } = await request.json();

    if (!chatRoomId) {
      return NextResponse.json(
        { error: 'Chat room ID is required' },
        { status: 400 }
      );
    }

    // Get the chat room and AI model details
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
      include: { aiModel: true }
    });

    if (!chatRoom?.aiModel) {
      return NextResponse.json({ error: 'Chat room or AI model not found' }, { status: 404 });
    }

    // Create a pending message first
    const pendingMessage = await prisma.message.create({
      data: {
        content: prompt,
        chatRoomId: chatRoomId,
        isAIMessage: true,
        metadata: {
          type: 'image',
          status: 'generating',
          prompt: prompt,
          style: style
        }
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

    // Emit the pending message
    messageEmitter.emit(`chat:${chatRoomId}`, pendingMessage);

    // Start the async image generation process
    const enhancedPrompt = `${prompt}. 
      Style: Ultra realistic, photogenic, beautiful lighting, high fashion photography style.
      Character details: ${chatRoom.aiModel.appearance}
      Setting: Elegant and sophisticated
      Quality: 8k resolution, highly detailed`;

    console.log('Starting image generation with prompt:', enhancedPrompt);

    // Start the RunPod job
    const jobId = await RunPodClient.startImageGeneration(enhancedPrompt);

    return NextResponse.json({ 
      success: true,
      message: pendingMessage,
      jobId: jobId
    });

  } catch (error) {
    console.error('Error starting image generation:', error);
    return NextResponse.json({ 
      error: 'Failed to start image generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add a new endpoint to check image generation status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const chatRoomId = searchParams.get('chatRoomId');
    const messageId = searchParams.get('messageId');

    if (!jobId || !chatRoomId || !messageId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const status = await RunPodClient.checkJobStatus(jobId);

    if (status.status === 'COMPLETED' && status.output?.image) {
      // Upload to Cloudinary
      const uploadResponse = await cloudinary.uploader.upload(
        `data:image/png;base64,${status.output.image}`,
        {
          folder: 'chat-images',
          resource_type: 'image',
          public_id: `chat-${chatRoomId}-${Date.now()}`,
          transformation: [
            { quality: "auto:best" },
            { fetch_format: "auto" }
          ]
        }
      );

      // Update the message with the image URL
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          metadata: {
            type: 'image',
            status: 'completed',
            imageUrl: uploadResponse.secure_url
          }
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

      // Emit the updated message
      messageEmitter.emit(`chat:${chatRoomId}`, updatedMessage);

      return NextResponse.json({ 
        success: true,
        status: 'completed',
        message: updatedMessage
      });
    }

    return NextResponse.json({ 
      success: true,
      status: status.status
    });

  } catch (error) {
    console.error('Error checking image status:', error);
    return NextResponse.json({ 
      error: 'Failed to check image status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}