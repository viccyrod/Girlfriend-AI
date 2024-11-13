import { NextResponse } from 'next/server';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatRooms = await prisma.chatRoom.findMany({
      where: {
        users: {
          some: {
            email: user.email
          }
        }
      },
      include: {
        aiModel: {
          include: {
            createdBy: true
          }
        },
        users: true,
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    console.log('Found chat rooms:', chatRooms);

    const formattedRooms = chatRooms.map(room => ({
      id: room.id,
      name: room.name || '',
      aiModelId: room.aiModelId || '',
      aiModelImageUrl: room.aiModel?.imageUrl || null,
      users: room.users,
      messages: room.messages,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      aiModel: room.aiModel ? {
        ...room.aiModel,
        isHuman: false,
        isFollowing: false,
        isHumanX: false,
        createdBy: {
          id: room.aiModel.createdBy?.id || '',
          name: room.aiModel.createdBy?.name || '',
          email: room.aiModel.createdBy?.email || '',
          imageUrl: room.aiModel.createdBy?.image || null
        }
      } : null
    }));

    return NextResponse.json({ chatRooms: formattedRooms });
  } catch (error) {
    console.error('Error in GET /api/chat/rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat rooms' }, 
      { status: 500 }
    );
  }
}
