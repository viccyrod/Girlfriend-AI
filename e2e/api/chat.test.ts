// tests/api/chat.test.ts
import { test, expect, Page } from '@playwright/test';

async function authenticateUser(page: Page) {
  // Set a cookie to mock authentication
  await page.context().addCookies([
    {
      name: 'kinde_auth_token',
      value: 'mock_token',
      domain: 'localhost',
      path: '/',
    },
    {
      name: 'kinde_user',
      value: JSON.stringify({
        id: 'test_user_id',
        given_name: 'Test',
        family_name: 'User',
        email: 'testuser@example.com'
      }),
      domain: 'localhost',
      path: '/',
    }
  ]);

  // Navigate to the home page to ensure the app loads with the mocked auth
  await page.goto('http://localhost:3000');
}

test.describe('Chat API', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateUser(page);
  });

  test('GET /api/chat - should fetch chat rooms', async ({ request, context }) => {
    await context.addCookies([
      { name: 'kinde_auth_token', value: 'mock_token', domain: 'localhost', path: '/' },
    ]);
    const response = await request.get('/api/chat');
    console.log('GET /api/chat response status:', response.status());
    console.log('GET /api/chat response headers:', response.headers());
    const responseBody = await response.text();
    console.log('GET /api/chat response body:', responseBody);
    
    expect(response.ok()).toBeTruthy();
    const chatRooms = JSON.parse(responseBody);
    expect(Array.isArray(chatRooms)).toBeTruthy();
    // It's okay if there are no chat rooms, but the response should be an empty array
    expect(chatRooms.length).toBeGreaterThanOrEqual(0);
  });

  test('POST /api/chat - should create a new chat room', async ({ request, context }) => {
    await context.addCookies([
      { name: 'kinde_auth_token', value: 'mock_token', domain: 'localhost', path: '/' },
    ]);
    const response = await request.post('/api/chat', {
      data: {
        action: 'createChatRoom',
        name: 'Test Chat Room',
        aiModelId: 'cm2f0ifk100018e0enrwexhz3' // Use a valid AI model ID from your database
      }
    });
    console.log('POST /api/chat response status:', response.status());
    console.log('POST /api/chat response body:', await response.text());
    expect(response.ok()).toBeTruthy();
    const newRoom = await response.json();
    expect(newRoom.name).toBe('Test Chat Room');
    expect(newRoom.aiModelId).toBe('cm2f0ifk100018e0enrwexhz3');
  });

  test('POST /api/chat - should send a message', async ({ request, context }) => {
    await context.addCookies([
      { name: 'kinde_auth_token', value: 'mock_token', domain: 'localhost', path: '/' },
    ]);
    // First, create a chat room
    const createRoomResponse = await request.post('/api/chat', {
      data: {
        action: 'createChatRoom',
        name: 'Test Chat Room',
        aiModelId: 'cm2f0ifk100018e0enrwexhz3'
      }
    });
    const newRoom = await createRoomResponse.json();

    const response = await request.post('/api/chat', {
      data: {
        action: 'sendMessage',
        content: 'Test message',
        chatRoomId: newRoom.id,
        aiModelId: 'cm2f0ifk100018e0enrwexhz3'
      }
    });
    console.log('POST /api/chat (send message) response status:', response.status());
    console.log('POST /api/chat (send message) response body:', await response.text());
    
    expect(response.status()).toBe(200);
    const message = await response.json();
    expect(message.content).toBe('Test message');
  });

  test('DELETE /api/chat - should delete a chat room', async ({ request, context }) => {
    await context.addCookies([
      { name: 'kinde_auth_token', value: 'mock_token', domain: 'localhost', path: '/' },
    ]);
    // First, create a chat room
    const createRoomResponse = await request.post('/api/chat', {
      data: {
        action: 'createChatRoom',
        name: 'Test Chat Room',
        aiModelId: 'cm2f0ifk100018e0enrwexhz3'
      }
    });
    const newRoom = await createRoomResponse.json();

    const response = await request.delete('/api/chat', {
      data: {
        action: 'deleteChatRoom',
        roomId: newRoom.id
      }
    });
    console.log('DELETE /api/chat response status:', response.status());
    console.log('DELETE /api/chat response body:', await response.text());
    
    expect(response.status()).toBe(200);
    const result = await response.json();
    expect(result.success).toBe(true);
  });
});
