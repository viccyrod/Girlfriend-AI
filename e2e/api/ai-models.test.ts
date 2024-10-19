// tests/api/ai-models.test.ts
import { test, expect } from '@playwright/test';

test.describe('AI Models API', () => {
  test('GET /api/ai-models - should fetch all AI models', async ({ request }) => {
    const response = await request.get('/api/ai-models');
    expect(response.ok()).toBeTruthy();
    const aiModels = await response.json();
    expect(Array.isArray(aiModels)).toBeTruthy();
    expect(aiModels.length).toBeGreaterThan(0);
  });

  test('GET /api/ai-models/:id - should fetch a specific AI model', async ({ request }) => {
    // First, fetch all models to get a valid ID
    const allModelsResponse = await request.get('/api/ai-models');
    const allModels = await allModelsResponse.json();
    console.log('All AI models:', allModels);
    
    if (allModels.length === 0) {
      throw new Error('No AI models found. Make sure your database is seeded with test data.');
    }
    
    const modelId = allModels[0].id;

    const response = await request.get(`/api/ai-models/${modelId}`);
    console.log(`GET /api/ai-models/${modelId} response status:`, response.status());
    console.log(`GET /api/ai-models/${modelId} response body:`, await response.text());
    expect(response.ok()).toBeTruthy();
    const aiModel = await response.json();
    expect(aiModel.id).toBe(modelId);
    expect(aiModel.name).toBeTruthy();
    expect(aiModel.personality).toBeTruthy();
  });
});
