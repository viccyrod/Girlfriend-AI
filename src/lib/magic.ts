import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { generateAIModelDetails } from '@/lib/ai-client';
import { RunPodClient } from '@/lib/clients/runpod';
import { uploadBase64Image } from '@/lib/cloudinary';
import { GenerationType } from '@prisma/client';
import { TOKEN_COSTS } from './constants';

interface GenerateMagicCharacterOptions {
  prompt: string;
  userId: string;
  onGenerationCreated?: (generationId: string) => Promise<void>;
}

export async function generateMagicCharacter({ prompt, userId, onGenerationCreated }: GenerateMagicCharacterOptions) {
  // Create initial generation record
  const generation = await prisma.generation.create({
    data: {
      type: GenerationType.CHARACTER,
      userId,
      prompt,
      result: '',
      status: 'PENDING',
      cost: TOKEN_COSTS.CHARACTER
    }
  });

  if (onGenerationCreated) {
    await onGenerationCreated(generation.id);
  }

  // Use the existing AI model generation logic
  const response = await fetch('/api/ai-models/magic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customPrompt: prompt,
      isPrivate: true
    })
  });

  const result = await response.json();

  // Update generation with result
  await prisma.generation.update({
    where: { id: generation.id },
    data: {
      result: JSON.stringify(result),
      status: 'COMPLETED'
    }
  });

  return result;
} 