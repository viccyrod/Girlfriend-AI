import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/lib/prisma';

const ITEMS_PER_PAGE = 10;
const ADMIN_EMAIL = 'victor@hypergrow.ai';

export async function GET(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where = {
      ...(status && status !== 'all' && {
        status: status as 'PENDING' | 'SENT' | 'FAILED'
      }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' as const } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } }
        ]
      })
    };

    // Get total count for pagination
    const total = await prisma.emailLog.count({ where });

    // Get logs with pagination
    const logs = await prisma.emailLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE
    });

    return NextResponse.json({
      logs,
      total,
      hasMore: total > page * ITEMS_PER_PAGE
    });

  } catch (error) {
    console.error('Failed to fetch email logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch email logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 