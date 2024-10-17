import { useState, useEffect } from 'react';
import { getChatRoomMessages, sendMessage } from '@/app/api/chat/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ChatMessages({ chatRoom }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    if (chatRoom) {
      fetchMessages();
    }
  }, [chatRoom]);

  async function fetchMessages() {
    try {
      const fetchedMessages = await getChatRoomMessages(chatRoom.id);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const sentMessage = await sendMessage(newMessage, chatRoom.id);
      setMessages([...messages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-2">
            <Avatar>
              <AvatarImage src={message.user.image} />
              <AvatarFallback>{message.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{message.user.name}</p>
              <p className="text-foreground">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  );
}
