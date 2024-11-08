import { NextResponse } from 'next/server';
import prisma from '@/lib/clients/prisma';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function DELETE(
  request: Request,
  { params }: { params: { modelId: string } }
) {
  try {
    const session = await getKindeServerSession();
    const { getUser } = session;
    const user = await getUser();
    if (!session || !user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.modelId },
      include: { users: true }
    });

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Verify user has permission to delete this room
    if (!chatRoom.users.some(user => user.id === user.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete the chat room and all associated messages (using cascade)
    await prisma.chatRoom.delete({
      where: { id: params.modelId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete chat room:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat room' },
      { status: 500 }
    );
  }
}
