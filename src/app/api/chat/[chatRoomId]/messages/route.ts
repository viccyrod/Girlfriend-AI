import { NextResponse } from 'next/server';
import { getChatRoomMessages } from '@/app/api/chat/actions';

export async function GET(
  request: Request,
  { params }: { params: { chatRoomId: string } }
) {
  try {
    const messages = await getChatRoomMessages(params.chatRoomId);
    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat room messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
