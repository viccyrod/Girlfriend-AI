import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { TOKEN_COSTS } from '@/lib/constants';
import { GenerationType } from '@prisma/client';

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        tokens: true,
        generations: {
          select: {
            type: true,
            cost: true
          }
        }
      }
    });

    const generations = userData?.generations || [];
    const tokens = userData?.tokens || 0;

    // Calculate usage for each type
    const chatUsed = generations.filter(g => g.type === GenerationType.CHAT).length;
    const imagesUsed = generations.filter(g => g.type === GenerationType.IMAGE).length;
    const charactersUsed = generations.filter(g => g.type === GenerationType.CHARACTER).length;

    // Calculate limits based on remaining tokens
    const chatLimit = Math.floor(tokens / TOKEN_COSTS.CHAT);
    const imageLimit = Math.floor(tokens / TOKEN_COSTS.IMAGE);
    const characterLimit = Math.floor(tokens / TOKEN_COSTS.CHARACTER);

    return NextResponse.json({
      currentPlan: 'Token Based',
      chat: {
        used: chatUsed,
        limit: chatLimit + chatUsed,
        percentage: (chatUsed / (chatLimit + chatUsed)) * 100
      },
      images: {
        used: imagesUsed,
        limit: imageLimit + imagesUsed,
        percentage: (imagesUsed / (imageLimit + imagesUsed)) * 100
      },
      characters: {
        used: charactersUsed,
        limit: characterLimit + charactersUsed,
        percentage: (charactersUsed / (characterLimit + charactersUsed)) * 100
      }
    });
  } catch (error) {
    console.error('Failed to fetch usage stats:', error);
    return NextResponse.json({ error: 'Failed to fetch usage stats' }, { status: 500 });
  }
} 