import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/lib/prisma';

const ADMIN_EMAIL = 'victor@hypergrow.ai';

export async function GET(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        isAI: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('Found users:', users.length);
    return NextResponse.json(users);

  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 