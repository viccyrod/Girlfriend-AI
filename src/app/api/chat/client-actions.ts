// Import the Message and ChatRoom types from the Prisma client
import { Message, ChatRoom } from '@prisma/client';

// Function to retrieve all chat rooms
export async function getChatRooms(): Promise<ChatRoom[]> {
  console.log('Fetching chat rooms...');
  const response = await fetch('/api/chat');
  
  if (!response.ok) {
    throw new Error('Failed to fetch chat rooms');
  }

  const rooms = await response.json();
  console.log('Fetched chat rooms:', rooms);
  return rooms;
}

// Function to create a new chat room
export async function createChatRoom(name: string, aiModelId: string): Promise<ChatRoom> {
  // Validate the AI Model ID
  if (!aiModelId || typeof aiModelId !== 'string' || aiModelId.length < 5) {
    throw new Error('Invalid AI Model ID format');
  }

  // Verify the AI model exists first
  const modelResponse = await fetch(`/api/aiModels/${aiModelId}`);
  if (!modelResponse.ok) {
    throw new Error('AI Model not found');
  }

  // Make a POST request to create a new chat room
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      action: 'createChatRoom', 
      name, 
      aiModelId,
      mode: 'greeting'
    }),
  });
  
  // If the request fails, parse and throw an error with the provided error message
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create chat room');
  }
  
  // Parse and return the response data as a ChatRoom object
  return response.json();
}

// Function to send a message to a specific chat room
export async function sendMessage(
  content: string, 
  chatRoomId: string, 
  aiModelId: string | null
): Promise<{ message: Message, aiMessage: Message }> {
  // Make a POST request to the API endpoint to send the message
  const response = await fetch(`/api/chat/${chatRoomId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, aiModelId }),
  });
  
  // If the request fails, throw an error
  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  
  // Parse and return the response data, which includes the user message and the AI-generated response
  return response.json();
}

// Function to delete a specific chat room
export async function deleteChatRoom(roomId: string) {
  // Make a DELETE request to the API endpoint to delete the chat room with the given ID
  const response = await fetch(`/api/chat/${roomId}`, {
    method: 'DELETE',
  });

  // If the request fails, throw an error
  if (!response.ok) {
    throw new Error('Failed to delete chat room');
  }

  // Parse and return the response data
  return response.json();
}

export async function getOrCreateChatRoom(id: string): Promise<ChatRoom> {
  const response = await fetch(`/api/chat/${id}/message`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to create chat room');
  }
  
  return response.json();
}

// Add this new function to get chat room messages
export async function getChatRoomMessages(chatRoomId: string): Promise<Message[]> {
  console.log('Fetching messages for chat room:', chatRoomId);
  const response = await fetch(`/api/chat/${chatRoomId}/messages`);
  
  if (!response.ok) {
    console.error('Failed to fetch messages:', response.statusText);
    throw new Error('Failed to fetch messages');
  }

  const messages = await response.json();
  console.log('Fetched messages:', messages);
  return messages;
}

// This code defines utility functions for interacting with the chat API endpoints for managing chat rooms and messages.
// Here's a detailed breakdown of each function:
// 1. `getChatRooms(): Promise<ChatRoom[]>`
//    - This function is responsible for retrieving all chat rooms.
//    - It makes a GET request to the `/api/chat` endpoint.
//    - If the request fails, it throws an error with a relevant message.
//    - If the request is successful, it returns the chat rooms as an array of `ChatRoom` objects.
// 2. `createChatRoom(name: string, aiModelId: string): Promise<ChatRoom>`
//    - This function is used to create a new chat room.
//    - It first verifies that the AI model exists by making a GET request to `/api/ai-models/{aiModelId}`.
//    - It then makes a POST request to the `/api/chat` endpoint with the chat room name and AI model ID.
//    - If the request fails, it throws an error containing the error message provided by the API.
//    - If successful, it returns the newly created `ChatRoom` object.
// 3. `sendMessage(content: string, chatRoomId: string, aiModelId: string | null): Promise<{ message: Message, aiMessage: Message }>`
//    - This function is used to send a message to a specific chat room.
//    - It makes a POST request to the `/api/chat/{chatRoomId}/messages` endpoint with the message content in the body.
//    - If the request fails, it throws an error with a relevant message.
//    - If successful, it returns both the user's message and the AI's response.
// 4. `deleteChatRoom(roomId: string)`
//    - This function deletes a specific chat room.
//    - It makes a DELETE request to the `/api/chat/{roomId}` endpoint to remove the chat room from the database.
//    - If the request fails, it throws an error with a relevant message.
//    - If the request is successful, it returns the response data.
// 5. `getChatRoomMessages(chatRoomId: string): Promise<Message[]>`
//    - This function retrieves messages for a specific chat room.
//    - It makes a GET request to the `/api/chat/{chatRoomId}/messages` endpoint.
//    - If the request fails, it throws an error with a relevant message.
//    - If successful, it returns the messages as an array of `Message` objects.
// 6. These utility functions are designed to interact with the chat API to manage chat rooms and messages efficiently, including retrieval, creation, sending, and deletion.

export async function navigateToChatRoom(chatRoomId: string) {
  try {
    // Navigate to the chat room page
    window.location.href = `/chat/room/${chatRoomId}`;
  } catch (error) {
    console.error('Failed to navigate to chat room:', error);
    throw error;
  }
}