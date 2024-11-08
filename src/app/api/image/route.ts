import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { RunPodClient } from '@/lib/clients/runpod';
import prisma from '@/lib/clients/prisma';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
  try {
    const { prompt, modelId, modelCharacteristics } = await request.json();

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the AI model's characteristics from the database for backup
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: modelId },
      include: { aiModel: true }
    });

    // Combine passed characteristics with database values
    const appearance = modelCharacteristics?.appearance || chatRoom?.aiModel?.appearance;
    
    // Create a more detailed prompt that always includes the model's characteristics
    const enhancedPrompt = `

      ${prompt},
      8k uhd, high quality, highly detailed, professional photography, 
      sharp focus, high resolution, masterpiece, best quality, 
      realistic lighting, natural skin texture. ${appearance}
    `.trim();

    // Generate the image
    const base64Image = await RunPodClient.generateImage(enhancedPrompt);

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64Image}`,
      {
        folder: 'ai-models',
        resource_type: 'image',
        public_id: `${chatRoom?.aiModel?.name}-${Date.now()}`,
      }
    );

    // Create Image record
    await prisma.image.create({
      data: {
        imageUrl: uploadResponse.secure_url,
        imageData: base64Image,
        aiModelId: chatRoom?.aiModel?.id as string,
        isNSFW: false
      }
    });

    // Create message with image
    const message = await prisma.message.create({
      data: {
        content: prompt,
        chatRoomId: modelId,
        userId: currentUser.id,
        isAIMessage: true,
        metadata: {
          type: 'image',
          imageUrl: uploadResponse.secure_url,
          prompt: enhancedPrompt
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

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  }
}