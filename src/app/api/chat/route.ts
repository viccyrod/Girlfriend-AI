import { NextResponse } from 'next/server';
import { createChatRoom, sendMessage, getChatRooms, getChatRoomMessages } from './actions';

export async function POST(request: Request) {
  const { action, ...data } = await request.json();

  try {
    switch (action) {
      case 'createChatRoom':
        const chatRoom = await createChatRoom(data.name, data.userIds);
        return NextResponse.json(chatRoom);
      case 'sendMessage':
        const message = await sendMessage(data.content, data.chatRoomId);
        return NextResponse.json(message);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const chatRooms = await getChatRooms();
    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error('Error in GET /api/chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 });
  }
}
