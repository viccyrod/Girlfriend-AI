import { NextResponse } from 'next/server';
import { createChatRoomAction, getChatRoomsAction, deleteChatRoom, sendMessage } from '@/utils/chatActions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received POST request to /api/chat with body:', JSON.stringify(body, null, 2));

    const { action, content, chatRoomId, aiModelId, name } = body;

    switch (action) {
      case 'createChatRoom':
        try {
          console.log('Creating chat room with name:', name, 'and aiModelId:', aiModelId);
          const chatRoom = await createChatRoomAction(name, aiModelId);
          console.log('Chat room created:', JSON.stringify(chatRoom, null, 2));
          return NextResponse.json(chatRoom);
        } catch (error) {
          console.error('Error in createChatRoom:', error);
          return NextResponse.json({ error: 'Failed to create chat room' }, { status: 400 });
        }
      case 'sendMessage':
        try {
          console.log('Sending message in chatRoomId:', chatRoomId, 'with content:', content);
          const message = await sendMessage(content, chatRoomId, aiModelId);
          console.log('Message sent:', JSON.stringify(message, null, 2));
          return NextResponse.json(message);
        } catch (error) {
          console.error('Error in sendMessage:', error);
          return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
        }
      case 'deleteChatRoom':
        try {
          console.log('Deleting chat room with id:', chatRoomId);
          await deleteChatRoom(chatRoomId);
          console.log('Chat room deleted successfully');
          return NextResponse.json({ success: true });
        } catch (error) {
          console.error('Error in deleteChatRoom:', error);
          return NextResponse.json({ error: 'Failed to delete chat room' }, { status: 500 });
        }
      default:
        console.error('Invalid action received:', action);
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { roomId } = await request.json();
    console.log('Received roomId for deletion:', roomId);

    await deleteChatRoom(roomId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/chat:', error);
    return NextResponse.json({ error: 'Failed to delete chat room' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const chatRooms = await getChatRoomsAction();
    console.log('Fetched chat rooms:', JSON.stringify(chatRooms, null, 2));
    return NextResponse.json(chatRooms);
  } catch (error) {
    console.error('Error in GET /api/chat:', error);
    return NextResponse.json({ error: 'Failed to fetch chat rooms', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
