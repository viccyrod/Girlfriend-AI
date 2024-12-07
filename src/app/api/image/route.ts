import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import { messageEmitter } from '@/lib/messageEmitter';
import { addImageToAIModel } from '@/lib/utils/image';

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

    // Verify RunPod API key is set
    if (!process.env.RUNPOD_API_KEY) {
      console.error('❌ RunPod API key is not configured');
      return NextResponse.json({ error: 'RunPod API key is not configured' }, { status: 500 });
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

    console.log('🔍 Checking image status:', { jobId, chatRoomId, messageId });

    if (!jobId || !chatRoomId || !messageId) {
      console.error('❌ Missing parameters:', { jobId, chatRoomId, messageId });
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // First check if message already has an image URL
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chatRoom: {
          include: {
            aiModel: true
          }
        }
      }
    });

    console.log('📝 Message metadata:', {
      id: message?.id,
      content: message?.content,
      metadata: message?.metadata,
      status: (message?.metadata as { status?: string })?.status,
      imageUrl: (message?.metadata as { imageUrl?: string })?.imageUrl
    });

    // Check if message has completed image metadata
    if (message?.metadata && 
        typeof message.metadata === 'object' && 
        'type' in message.metadata && 
        message.metadata.type === 'image' &&
        'status' in message.metadata &&
        message.metadata.status === 'completed') {
      console.log('✅ Image already processed');
      return NextResponse.json({ 
        success: true,
        status: 'completed',
        message
      });
    }

    console.log('🤖 Checking RunPod job status...');
    const status = await RunPodClient.checkJobStatus(jobId);
    console.log('🤖 RunPod status:', status);

    if (status.status === 'COMPLETED' && status.output?.image) {
      console.log('🎨 Image generated, uploading to Cloudinary...', {
        imageDataLength: status.output.image.length,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
      });
      
      try {
        // Verify Cloudinary configuration
        const cloudinaryConfig = cloudinary.config();
        console.log('☁️ Cloudinary configuration:', {
          cloudName: cloudinaryConfig.cloud_name,
          hasApiKey: !!cloudinaryConfig.api_key,
          hasApiSecret: !!cloudinaryConfig.api_secret
        });

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

        console.log('☁️ Cloudinary upload successful:', {
          url: uploadResponse.secure_url,
          publicId: uploadResponse.public_id,
          format: uploadResponse.format,
          size: uploadResponse.bytes
        });

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

        // Save the image to the Image table
        if (message?.chatRoom?.aiModel?.id) {
          await addImageToAIModel(
            message.chatRoom.aiModel.id,
            uploadResponse.secure_url,
            status.output.image,
            false
          );
          console.log('💾 Image saved to Image table');
        }

        console.log('📝 Message updated with image URL');
        
        console.log('📢 Emitting updated message to chat:', updatedMessage);
        messageEmitter.emit(`chat:${chatRoomId}`, updatedMessage);

        return NextResponse.json({ 
          success: true,
          status: 'completed',
          message: updatedMessage
        });
      } catch (error) {
        console.error('❌ Error processing completed image:', error);
        return NextResponse.json({ 
          error: 'Failed to process completed image',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    console.log('⏳ Image not ready yet, status:', status.status);
    return NextResponse.json({ 
      success: true,
      status: status.status
    });

  } catch (error) {
    console.error('❌ Error checking image status:', error);
    return NextResponse.json({ 
      error: 'Failed to check image status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}