import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDbUser } from '@/lib/actions/server/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getDbUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const model = await prisma.aIModel.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        userId: true,
      }
    });

    if (!model) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    // Only allow the creator to check status
    if (model.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({ status: model.status || 'PENDING' });
  } catch (error) {
    console.error('Error checking model status:', error);
    return NextResponse.json(
      { error: 'Failed to check model status' },
      { status: 500 }
    );
  }
} 