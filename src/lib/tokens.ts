import prisma from '@/lib/clients/prisma';
import { TOKEN_COSTS } from '@/lib/constants';
import { GenerationType } from '@prisma/client';

export async function checkTokenBalance(userId: string, type: GenerationType): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tokens: true }
  });

  if (!user) return false;
  return user.tokens >= TOKEN_COSTS[type];
}

export async function deductTokens(userId: string, type: GenerationType, prompt: string = ''): Promise<boolean> {
  try {
    const cost = TOKEN_COSTS[type];
    
    // Use a transaction to ensure atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Check current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { tokens: true }
      });

      if (!user || user.tokens < cost) {
        throw new Error('Insufficient tokens');
      }

      // Deduct tokens and create generation record
      await tx.user.update({
        where: { id: userId },
        data: {
          tokens: {
            decrement: cost
          }
        }
      });

      await tx.generation.create({
        data: {
          type,
          userId,
          cost,
          prompt,
          result: type === GenerationType.CHAT ? 'Chat message sent' : 'Image generated'
        }
      });

      return true;
    });

    return result;
  } catch (error) {
    console.error('Failed to deduct tokens:', error);
    return false;
  }
} 