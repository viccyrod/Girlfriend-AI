// Import the Message type from the chat types definition
import { Message } from '@/types/chat';

// Function to retrieve all messages from a specific chat room
export async function getChatRoomMessages(chatRoomId: string): Promise<Message[]> {
  // Make a request to the API endpoint to fetch messages for the given chat room ID
  const response = await fetch(`/api/chat/${chatRoomId}/messages`);
  
  // If the request fails, throw an error
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  // Parse and return the response data as an array of Message objects
  return response.json();
}

// Function to send a message to a specific chat room
export async function sendMessage(
  chatRoomId: string,
  message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'user'>
): Promise<{ userMessage: Message, aiMessage: Message }> {
  // Make a POST request to the API endpoint to send the message
  const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });

  // If the request fails, parse and throw an error with the provided error message
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to send message');
  }

  // Parse and return the response data, which includes the user message and the AI-generated response
  const data = await response.json();
  return { userMessage: data.userMessage, aiMessage: data.aiMessage };
}

// Function to delete a specific message from a chat room
export async function deleteMessage(chatRoomId: string, messageId: string) {
  // Make a DELETE request to the API endpoint to delete the message with the given ID
  await fetch(`/api/chat/${chatRoomId}/messages/${messageId}`, {
    method: 'DELETE'
  });
}

// This code defines utility functions for interacting with the chat API endpoints for fetching, sending, and deleting messages.
// Here's a detailed breakdown of each function:
// 1. `getChatRoomMessages(chatRoomId: string): Promise<Message[]>`
//    - This function is responsible for retrieving all messages from a specific chat room.
//    - It makes a GET request to the `/api/chat/{chatRoomId}/messages` endpoint.
//    - If the request fails, it throws an error with a relevant message.
//    - If the request is successful, it returns the messages as an array of `Message` objects.
// 2. `sendMessage(chatRoomId: string, message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'user'>): Promise<{ userMessage: Message, aiMessage: Message }>`
//    - This function is used to send a message to a specific chat room.
//    - It makes a POST request to the `/api/chat/{chatRoomId}/messages` endpoint with the message content in the body.
//    - If the request fails, it throws an error containing the error message provided by the API.
//    - If successful, it returns both the user's message and the AI's response.
// 3. `deleteMessage(chatRoomId: string, messageId: string)`
//    - This function deletes a specific message from a chat room.
//    - It makes a DELETE request to the `/api/chat/{chatRoomId}/messages/{messageId}` endpoint to remove the message from the database.
//    - No response data is returned; the function only ensures the DELETE request is sent.
// 4. These utility functions are designed to interact with the chat API to manage chat messages efficiently, including retrieval, sending, and deletion of messages.
