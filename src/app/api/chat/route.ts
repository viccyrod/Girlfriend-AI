import { NextResponse } from 'next/server';
import { createChatRoom as createChatRoomAction, sendMessage, getChatRooms as getChatRoomsAction } from './actions';

export async function POST(request: Request) {
  try {
    const { action, ...data } = await request.json();
    console.log('Received action:', action);
    console.log('Received data:', data);

    switch (action) {
      case 'createChatRoom':
        try {
          const chatRoom = await createChatRoomAction(data.name, data.userIds);
          return NextResponse.json(chatRoom);
        } catch (error) {
          console.error('Error in createChatRoom:', error);
          return NextResponse.json({ error: 'Failed to create chat room. Some users may not exist.' }, { status: 400 });
        }
      case 'sendMessage':
        try {
          const message = await sendMessage(data.content, data.chatRoomId);
          return NextResponse.json(message);
        } catch (error) {
          console.error('Error in sendMessage:', error);
          return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
        }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const chatRooms = await getChatRoomsAction();
    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error('Error in GET /api/chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat rooms' }, { status: 500 });
  }
}
