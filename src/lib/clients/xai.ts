import axios from 'axios';
import { AIModel } from '@prisma/client';

// Add detailed type for API request
interface XAIRequestPayload {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
  context?: string[];
}

interface XAIResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Add environment variable type for the model
const DEFAULT_MODEL = 'grok-beta';

export async function getAIResponse(
  content: string,
  aiModel: AIModel,
  memories: string[] = []
): Promise<string> {
  try {
    // Validate API key
    if (!process.env.XAI_API_KEY) {
      throw new Error('XAI_API_KEY not configured');
    }

    const response = await makeXAIRequest({
      model: process.env.NEXT_PUBLIC_AI_MODEL || DEFAULT_MODEL, // Use consistent model
      messages: [
        {
          role: 'system',
          content: constructBasePrompt(aiModel, memories, content)
        },
        {
          role: 'user',
          content
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      context: memories // Add context for better continuity
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid API response format');
    }

    return response.choices[0].message.content;
  } catch (error) {
    console.error('X.AI API Error:', error);
    
    // More specific fallback messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return `I'm a bit busy right now. Can you try again in a moment?`;
      }
      if (error.message.includes('API key')) {
        return `I'm having trouble connecting. Please contact support.`;
      }
    }
    
    // Default fallback
    return `Hello! I'm ${aiModel.name}. How can I help you today?`;
  }
}

async function makeXAIRequest(requestData: XAIRequestPayload): Promise<XAIResponse> {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      throw new Error('X.AI API key not configured');
    }

    const response = await axios.post<XAIResponse>(
      'https://api.x.ai/v1/chat/completions',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        }
      }
    );

    return response.data;

  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('X.AI API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });

      switch (error.response.status) {
        case 422:
          throw new Error(`X.AI API Validation Error: ${JSON.stringify(error.response.data)}`);
        case 401:
          throw new Error('X.AI API Authentication Error');
        case 429:
          throw new Error('X.AI API Rate Limit Exceeded');
        default:
          throw new Error(`X.AI API Error: ${error.response.statusText}`);
      }
    }
    
    throw new Error('Failed to make X.AI API request');
  }
}

function constructBasePrompt(
  aiModel: AIModel, 
  memories: string[],
  userMessage: string
): string {
  if (!aiModel) {
    throw new Error('AI Model is required');
  }

  // Safely construct personality traits
  const traits = [
    aiModel.personality && `Personality: ${aiModel.personality}`,
    aiModel.appearance && `Appearance: ${aiModel.appearance}`,
    aiModel.backstory && `Backstory: ${aiModel.backstory}`,
    aiModel.hobbies && `Hobbies: ${aiModel.hobbies}`,
    aiModel.likes && `Likes: ${aiModel.likes}`,
    aiModel.dislikes && `Dislikes: ${aiModel.dislikes}`
  ].filter(Boolean);

  // Build memory context
  const memoryContext = memories.length > 0 
    ? `\nPrevious conversation context:\n${memories.join('\n')}`
    : '\nNo previous conversation context available.';

  // Construct the complete prompt
  return `You are ${aiModel.name}, an AI companion with the following characteristics:

${traits.join('\n')}

Age: ${aiModel.age || 'unspecified'}
${memoryContext}

Please maintain these characteristics in your responses and interact naturally with the user.
Current user message: "${userMessage}"

Remember to:
1. Stay in character
2. Be engaging and natural
3. Reference previous context when relevant
4. Maintain consistent personality traits`;
}

export async function generateGreeting(
  aiModel: AIModel,
  memories: string[] = []
): Promise<string> {
  try {
    return await getAIResponse(
      "Please introduce yourself briefly.",
      aiModel,
      memories
    );
  } catch (error) {
    console.error('Error generating greeting:', error);
    return `Hello! I'm ${aiModel.name}. How can I help you today?`;
  }
}

///TEST FUNCTION
export async function testXAIConnection(message: string = "Hello! This is a test message."): Promise<void> {
  try {
    console.log('🚀 Testing X.AI/Grok API connection...');
    
    // Check environment variables
    console.log('Environment check:', {
      hasApiKey: !!process.env.XAI_API_KEY,
      apiKeyLength: process.env.XAI_API_KEY?.length,
    });

    const testPayload: XAIRequestPayload = {
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are Grok, an AI assistant. Please respond briefly.'
        },
        {
          role: 'user',
          content: message
        }
      ]
    };

    const response = await makeXAIRequest(testPayload);
    
    console.log('📤 Sending test payload:', {
      ...testPayload,
      model: '[REDACTED]'
    });
    
    console.log('✅ API Test successful!');
    console.log('📥 Response:', {
      content: response.choices[0].message.content,
      usage: response.usage
    });

  } catch (error) {
    console.error('❌ API Test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}