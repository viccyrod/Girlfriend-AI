import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { RunPodClient } from '@/lib/clients/runpod';
import prisma from '@/lib/clients/prisma';
import { v2 as cloudinary } from 'cloudinary';

if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, chatRoomId } = await request.json();

    if (!chatRoomId) {
      return NextResponse.json(
        { error: 'Chat room ID is required' },
        { status: 400 }
      );
    }

    // Generate image using RunPod
    const base64Image = await RunPodClient.generateImage(prompt);
    
    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Image}`,
      {
        folder: 'chat-images',
        resource_type: 'image',
        public_id: `chat-${chatRoomId}-${Date.now()}`,
      }
    );

    // Save the message
    const message = await prisma.message.create({
      data: {
        content: prompt,
        chatRoomId: chatRoomId,
        userId: currentUser.id,
        isAIMessage: true,
        metadata: {
          type: 'image',
          imageUrl: uploadResponse.secure_url,
          prompt: prompt
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

    return NextResponse.json({ 
      success: true,
      message,
      imageUrl: uploadResponse.secure_url 
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}