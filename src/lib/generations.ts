import { GenerationType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { TOKEN_COSTS } from './constants';

export async function trackGeneration(userId: string, type: GenerationType, prompt: string, result: string) {
  const cost = TOKEN_COSTS[type];
  
  // Start a transaction to ensure both operations succeed or fail together
  return await prisma.$transaction(async (tx) => {
    // Check if user has enough tokens
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { tokens: true }
    });

    if (!user || user.tokens < cost) {
      throw new Error('Insufficient tokens');
    }

    // Create generation record
    await tx.generation.create({
      data: {
        type,
        userId,
        prompt,
        result,
        cost,
      }
    });

    // Deduct tokens from user
    await tx.user.update({
      where: { id: userId },
      data: {
        tokens: {
          decrement: cost
        }
      }
    });
  });
} 