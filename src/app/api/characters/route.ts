import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import { TOKEN_COSTS } from '@/lib/constants';
import { GenerationType } from '@prisma/client';
import { NextResponse } from "next/server";
import { generateMagicCharacter } from "@/lib/magic";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has enough tokens
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tokens: true }
    });

    if (!userData || userData.tokens < TOKEN_COSTS.CHARACTER) {
      return NextResponse.json({ error: 'Insufficient tokens' }, { status: 400 });
    }

    // Use magic generation like images
    const result = await generateMagicCharacter({
      prompt,
      userId: user.id,
      onGenerationCreated: async (generationId) => {
        // Deduct tokens immediately when generation starts
        await prisma.user.update({
          where: { id: user.id },
          data: {
            tokens: {
              decrement: TOKEN_COSTS.CHARACTER
            }
          }
        });
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Character generation error:', error);
    return NextResponse.json({ error: 'Failed to generate character' }, { status: 500 });
  }
}