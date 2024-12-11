import { NextResponse } from 'next/server';
import { getDbUser } from '@/lib/actions/server/auth';
import prisma from '@/lib/clients/prisma';
import { v2 as cloudinary } from 'cloudinary';
import { RunPodClient } from '@/lib/clients/runpod';
import { messageEmitter } from '@/lib/messageEmitter';
import { addImageToAIModel } from '@/lib/utils/image';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  try {
    const currentUser = await getDbUser();
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

    console.log('🎨 Creating image generation message...');

    // Create a pending message with server-side ID
    const pendingMessage = await prisma.message.create({
      data: {
        id: `server-${Date.now()}`,
        content: prompt,
        chatRoomId: chatRoomId,
        isAIMessage: true,
        userId: currentUser.id,
        aiModelId: chatRoom.aiModel.id,
        role: 'assistant',
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

    console.log('📝 Created pending message:', pendingMessage.id);

    // Emit the pending message immediately
    messageEmitter.emit(`chat:${chatRoomId}`, { 
      type: 'image_generation',
      message: pendingMessage 
    });

    // Start the async image generation process
    const enhancedPrompt = `${prompt}. 
      Style: Ultra realistic, photogenic, beautiful lighting, high fashion photography style.
      Character details: ${chatRoom.aiModel.appearance}
      Setting: Elegant and sophisticated
      Quality: 8k resolution, highly detailed`;

    console.log('🎨 Starting image generation with prompt:', enhancedPrompt);

    // Start the RunPod job
    const jobId = await RunPodClient.startImageGeneration(enhancedPrompt);

    console.log('🚀 RunPod job started:', jobId);

    // Start polling for status in the background
    pollImageStatus(jobId, pendingMessage.id, chatRoomId, prompt);

    return NextResponse.json({ 
      success: true,
      message: pendingMessage,
      jobId: jobId
    });

  } catch (error) {
    console.error('❌ Error starting image generation:', error);
    return NextResponse.json({ 
      error: 'Failed to start image generation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to poll image status
async function pollImageStatus(jobId: string, messageId: string, chatRoomId: string, originalPrompt: string) {
  try {
    let retries = 0;
    const maxRetries = 30;
    const pollInterval = setInterval(async () => {
      try {
        if (retries >= maxRetries) {
          clearInterval(pollInterval);
          throw new Error('Image generation timed out');
        }

        const status = await RunPodClient.checkJobStatus(jobId);
        console.log(`🔍 Checking job status (attempt ${retries + 1}):`, status.status);

        if (status.status === 'COMPLETED' && status.output?.image) {
          clearInterval(pollInterval);
          
          console.log('🖼️ Image generation completed, uploading to Cloudinary...');
          
          try {
            // Upload to Cloudinary
            const uploadResponse = await fetch(new URL('/api/upload', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').toString(), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                base64Image: status.output.image,
                folder: 'chat-images',
                publicId: `chat-${chatRoomId}-${Date.now()}`
              })
            });

            if (!uploadResponse.ok) {
              throw new Error('Failed to upload image');
            }

            const { url } = await uploadResponse.json();
            console.log('📸 Image uploaded successfully:', url);

            // Update message with image URL
            const updatedMessage = await prisma.message.update({
              where: { id: messageId },
              data: {
                metadata: {
                  type: 'image',
                  status: 'completed',
                  imageUrl: url,
                  prompt: originalPrompt
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

            console.log('📝 Message updated with image URL');

            // Emit the updated message with retry logic
            let emitSuccess = false;
            for (let i = 0; i < 3 && !emitSuccess; i++) {
              try {
                messageEmitter.emit(`chat:${chatRoomId}`, {
                  type: 'image_generation',
                  message: updatedMessage
                });
                emitSuccess = true;
                console.log('📢 Image update emitted to chat successfully');
              } catch (error) {
                console.error(`❌ Failed to emit message update (attempt ${i + 1}):`, error);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
              }
            }

            if (!emitSuccess) {
              console.error('❌ Failed to emit message update after all retries');
            }

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
        } else if (status.status === 'FAILED') {
          clearInterval(pollInterval);
          throw new Error('Image generation failed');
        }

        retries++;
      } catch (error) {
        clearInterval(pollInterval);
        console.error('❌ Error in status polling:', error);
        
        // Update message with error status
        const errorMessage = await prisma.message.update({
          where: { id: messageId },
          data: {
            metadata: {
              type: 'image',
              status: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        });

        messageEmitter.emit(`chat:${chatRoomId}`, {
          type: 'image_generation',
          message: errorMessage
        });
      }
    }, 2000);
  } catch (error) {
    console.error('❌ Failed to start polling:', error);
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
        messageEmitter.emit(`chat:${chatRoomId}`, { message: updatedMessage });

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