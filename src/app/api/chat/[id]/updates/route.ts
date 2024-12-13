import { NextRequest } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const roomId = params.id;
  const lastUpdate = req.nextUrl.searchParams.get('lastUpdate');
  const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : new Date(0);

  try {
    // Get updates since last poll
    const [updatedRoom, newMessages] = await Promise.all([
      prisma.chatRoom.findUnique({
        where: {
          id: roomId,
          updatedAt: {
            gt: lastUpdateDate
          }
        },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
              user: true
            }
          },
          aiModel: {
            include: {
              createdBy: true
            }
          }
        }
      }),
      prisma.message.findMany({
        where: {
          chatRoomId: roomId,
          createdAt: {
            gt: lastUpdateDate
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: true
        }
      })
    ]);

    return new Response(JSON.stringify({
      hasUpdates: !!(updatedRoom || newMessages.length > 0),
      room: updatedRoom,
      messages: newMessages
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching updates:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch updates' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 