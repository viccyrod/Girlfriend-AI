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

    // Enhance the prompt with AI model's characteristics
    const enhancedPrompt = `${prompt}. 
      Style: Ultra realistic, photogenic, beautiful lighting, high fashion photography style.
      Character details: ${chatRoom.aiModel.appearance}
      Setting: Elegant and sophisticated
      Quality: 8k resolution, highly detailed`;

    console.log('Generating image with prompt:', enhancedPrompt);

    // Generate image using RunPod
    const base64Image = await RunPodClient.generateImage(enhancedPrompt);
    
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Image}`,
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

    // Save the message
    const message = await prisma.message.create({
      data: {
        content: prompt,
        chatRoomId: chatRoomId,
        isAIMessage: true,
        metadata: {
          type: 'image',
          imageUrl: uploadResponse.secure_url,
          prompt: enhancedPrompt,
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

    // Emit the message for real-time updates
    messageEmitter.emit(`chat:${chatRoomId}`, message);

    return NextResponse.json({ 
      success: true,
      message,
      imageUrl: uploadResponse.secure_url 
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({ 
      error: 'Failed to generate image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}