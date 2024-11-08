import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import prisma from '@/lib/clients/prisma';
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrls, modelName } = await request.json();

    // Start the training process
    const training = await replicate.trainings.create(
      "ostris",
      "flux-dev-lora-trainer",
      "e440909d3512c31646ee2e0c7d6f6f4923224863a6a10c494606e79fb5844497",
      {
        destination: `${currentUser.id}/${modelName}`,
        input: {
          steps: 1000,
          lora_rank: 16,
          optimizer: "adamw8bit",
          batch_size: 1,
          resolution: "512,768,1024",
          autocaption: true,
          input_images: imageUrls.join(','),
          trigger_word: modelName,
          learning_rate: 0.0004,
          wandb_project: "flux_train_replicate",
          wandb_save_interval: 100,
          caption_dropout_rate: 0.05,
          cache_latents_to_disk: false,
          wandb_sample_interval: 100
        }
      }
    );

    // Store the training information in your database
    const newTraining = await prisma.modelTraining.create({
      data: {
        userId: currentUser.id,
        modelName: modelName,
        replicateTrainingId: training.id,
        status: 'STARTED',
      },
    });

    return NextResponse.json(newTraining, { status: 201 });
  } catch (error) {
    console.error('Error starting model training:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
