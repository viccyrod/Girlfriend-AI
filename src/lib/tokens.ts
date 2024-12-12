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

export function calculateTokens(amount: number): number {
  let bonus = 0;
  // Calculate bonus percentage based on amount
  if (amount >= 100000) {
    bonus = 1.00; // 100% bonus
  } else if (amount >= 50000) {
    bonus = 0.75; // 75% bonus
  } else if (amount >= 10000) {
    bonus = 0.65; // 65% bonus
  } else if (amount >= 5000) {
    bonus = 0.55; // 55% bonus
  } else if (amount >= 1000) {
    bonus = 0.45; // 45% bonus
  }

  const baseTokens = amount * 200; // Base rate: $1 = 200 tokens ($5 = 1,000 tokens)
  const bonusTokens = baseTokens * bonus;
  return Math.floor(baseTokens + bonusTokens);
}

// Utility function to format large numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
} 