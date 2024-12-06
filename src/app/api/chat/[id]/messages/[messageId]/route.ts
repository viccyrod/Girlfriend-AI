import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(
  request: Request,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = await prisma.message.findUnique({
      where: {
        id: params.messageId,
        chatRoomId: params.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message' },
      { status: 500 }
    );
  }
} 