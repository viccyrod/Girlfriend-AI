import { useState, useEffect } from 'react';
import { getChatRoomMessages, sendMessage } from '@/app/api/chat/actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Define the Message type
type Message = {
  id: string;
  content: string;
  user: {
    name: string;
    image: string;
  };
};

// Define the ChatRoom type
type ChatRoom = {
  id: string;
  // Add other properties as needed
};

export default function ChatMessages({ chatRoom }: { chatRoom: ChatRoom }) {
  // State to hold the list of messages in the chat room
  const [messages, setMessages] = useState<Message[]>([]);
  // State to manage the new message input by the user
  const [newMessage, setNewMessage] = useState('');

  // useEffect hook to fetch messages when the component mounts or chatRoom changes
  useEffect(() => {
    if (chatRoom) {
      // Define fetchMessages inside useEffect to avoid redefining it on every render
      const fetchMessages = async () => {
        try {
          // Fetch messages from the API for the given chat room
          const fetchedMessages = await getChatRoomMessages(chatRoom.id);
          // Update the state with the fetched messages
          setMessages(fetchedMessages as unknown as Message[]);
        } catch (error: unknown) {
          console.error('Failed to fetch messages:', error);
        }
      };
      // Call the fetchMessages function
      fetchMessages();
    }
  }, [chatRoom]); // Dependency array includes chatRoom to re-run effect when it changes

  // Function to handle sending a new message
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission behavior
    if (!newMessage.trim()) return; // Do nothing if the input is empty

    try {
      // Send the new message to the server
      const sentMessage = await sendMessage(newMessage, chatRoom.id);
      // Update the messages state to include the new message
      setMessages((prevMessages) => [...prevMessages, sentMessage as unknown as Message]);
      // Clear the input field after sending the message
      setNewMessage('');
    } catch (error: unknown) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Messages display area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex items-start space-x-2">
            {/* User avatar */}
            <Avatar>
              <AvatarImage src={message.user.image} alt={message.user.name} />
              <AvatarFallback>{message.user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              {/* User name */}
              <p className="font-medium text-foreground">{message.user.name}</p>
              {/* Message content */}
              <p className="text-foreground">{message.content}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Message input form */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          {/* Input field for new message */}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          {/* Send button */}
          <Button type="submit">Send</Button>
        </div>
      </form>
    </div>
  );
}
