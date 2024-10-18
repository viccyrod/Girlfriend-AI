import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function DELETE(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const messageId = params.messageId;

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.userId !== currentUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
