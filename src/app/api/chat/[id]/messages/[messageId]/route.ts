import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: params.id },
      include: { users: true },
    })

    if (!chatRoom || chatRoom.createdById !== currentUser.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
    })

    if (!message || message.chatRoomId !== params.id) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    await prisma.message.delete({
      where: { id: params.messageId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    )
  }
} 