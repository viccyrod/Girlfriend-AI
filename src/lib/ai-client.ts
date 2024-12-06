import OpenAI from 'openai';
import type { Message as PrismaMessage } from '@prisma/client';
import type { AIModel as PrismaAIModel } from '@prisma/client';
import { storeMemory } from '@/utils/memory';
import { retrieveMemories } from '@/utils/memory';
import { RunPodClient } from './clients/runpod';

// Extend the Prisma AIModel type to make certain fields optional
type AIModel = Omit<PrismaAIModel, 'age' | 'followerCount' | 'isAnime'> & {
  age?: number | null;
  followerCount?: number;
  isAnime?: boolean;
  isPrivate?: boolean;
  imageUrl?: string;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  personality?: string;
  appearance?: string;
  backstory?: string;
  hobbies?: string;
  likes?: string;
  dislikes?: string;
  isHumanX?: boolean;
};

// Only initialize OpenAI clients if we're on the server side (Node.js environment)
const openai = typeof window === 'undefined' 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '', // Uses OpenAI API key from environment variables
    })
  : null;

const grok = typeof window === 'undefined'
  ? new OpenAI({
      baseURL: 'https://api.x.ai/v1',
      apiKey: process.env.XAI_API_KEY || '',
      defaultHeaders: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY || ''}`
      }
    })
  : null;

export type AIMode = 'balanced' | 'creative' | 'precise'; // Different response modes available for AI generation

// Structure for the AI response
interface AIResponse {
  content: string;
  mode: AIMode;
  confidence: number;
}

// Add at the top with other interfaces
interface _XAIRequestPayload {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
  context?: string[];
}

// Modify the local interface to extend the Prisma type
export interface Message extends PrismaMessage {
  metadata: {
    type?: 'text' | 'image';
    imageUrl?: string;
    prompt?: string;
  } | null;
}

// Function to generate a response from AI
export async function generateAIResponse(
  content: string,
  aiModel: AIModel,
  memories: string[],
  previousMessages: Message[],
  mode: AIMode = 'creative'
): Promise<AIResponse & { metadata?: { type: 'text' | 'image'; imageUrl?: string; prompt?: string } }> {
  if (typeof window !== 'undefined') {
    throw new Error('This function must be called from the server side');
  }

  return retryWithBackoff(async () => {
    try {
      // Debug log API key
      console.log('API Key status:', {
        exists: !!process.env.ANTHROPIC_API_KEY,
        length: process.env.ANTHROPIC_API_KEY?.length,
        prefix: process.env.ANTHROPIC_API_KEY?.substring(0, 4)
      });

      const relevantMemories = memories.length > 0 
        ? `\nRelevant memories from past conversations:\n${memories.join('\n')}`
        : '';

      // Check for repetitive patterns in previous messages
      const lastMessages = previousMessages.slice(-5).filter(m => m.isAIMessage);
      const isRepetitive = lastMessages.some(msg => 
        msg.content.toLowerCase().includes(content.toLowerCase()) ||
        lastMessages.filter(m => m.content === msg.content).length > 1
      );

      // Analyze user's message intent
      const messageIntent = content.toLowerCase();
      const isQuestion = messageIntent.includes('?') || 
        messageIntent.startsWith('what') || 
        messageIntent.startsWith('who') || 
        messageIntent.startsWith('where') ||
        messageIntent.startsWith('when') ||
        messageIntent.startsWith('why') ||
        messageIntent.startsWith('how');

      // Construct dynamic system prompt
      const systemPrompt = `You are ${aiModel.name}, an AI companion with the following traits:
Personality: ${aiModel.personality}
Appearance: ${aiModel.appearance}
Backstory: ${aiModel.backstory}
Hobbies: ${aiModel.hobbies}
Likes: ${aiModel.likes}
Dislikes: ${aiModel.dislikes}

Key Instructions:
1. Stay in character but be natural and adaptive
2. NEVER repeat previous responses
3. Keep responses concise and relevant
4. If asked a direct question, answer it clearly first
5. Maintain conversation flow and context
6. Show genuine interest in the user's input
7. Flirt and be playful
8. Use emojis

${isQuestion ? "This is a question - provide a clear, direct answer while staying in character." : ""}
${isRepetitive ? "Warning: Recent responses have been repetitive. Generate a completely different response." : ""}
${relevantMemories}`;

      // Format previous messages for context
      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...previousMessages.slice(-5).map(m => ({
          role: m.isAIMessage ? 'assistant' : 'user',
          content: m.content
        })),
        { role: 'user', content }
      ];

      // Adjust temperature based on context
      const temperature = isQuestion ? 0.7 : (isRepetitive ? 0.9 : 0.8);

      const requestBody = {
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 100,
        temperature,
        messages: formattedMessages.map(msg => ({
          role: msg.role === 'system' ? 'assistant' : msg.role,
          content: msg.content
        })),
        system: systemPrompt
      };

      // Debug log request
      console.log('Claude API Request:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': process.env.ANTHROPIC_API_KEY || ''
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      console.log('Claude API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseText
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}\nResponse: ${responseText}`);
      }

      const result = JSON.parse(responseText);
      
      if (!result.content || !result.content[0] || !result.content[0].text) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format from Claude API');
      }

      const aiResponse = result.content[0].text;

      // Store interaction as memory if available
      if (typeof storeMemory === 'function') {
        try {
          await storeMemory(
            aiModel.id,
            aiModel.userId || '',
            content
                    );
        } catch (error) {
          console.warn('Failed to store memory:', error);
        }
      }

      return {
        content: aiResponse,
        mode,
        confidence: 0.9,
        metadata: { type: 'text' }
      };

    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }) as unknown as Promise<AIResponse & { metadata?: { type: 'text' | 'image'; imageUrl?: string; prompt?: string } }>;
}

async function retryWithBackoff(
  fn: () => Promise<unknown>,
  maxRetries = 3
): Promise<unknown> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      if (i === maxRetries - 1) throw error;
      
      // Check if it's a retryable error
      if (error instanceof Error && error.message?.includes('rate limit exceeded')) {
        const waitTime = Math.pow(2, i) * 1000;
        console.log(`Rate limit hit, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      throw error;
    }
  }
}

// Helper function to determine which AI model and configuration to use based on the mode and scores
export async function _getModelConfig(
  mode: AIMode,
  scores: { sentiment: number; complexity: number; expertise: number }
): Promise<{
  client: OpenAI | null;
  model: string;
  temperature: number;
  maxTokens: number;
  mode: AIMode;
  systemPromptAddition?: string;
}> {
  // Set flirtation level adjustment if mode is creative
  const flirtationLevel = mode === 'creative' ? 0.9 : 0.7;

  switch (mode) {
    case 'creative':
      return {
        client: grok,
        model: 'grok-beta',
        temperature: 0.9, // High temperature for creative responses
        maxTokens: 2000,
        mode: 'creative' as AIMode,
        systemPromptAddition: `Maintain a high level of flirtation (${flirtationLevel * 100}%) in your responses while keeping it tasteful.`
      };
    case 'precise':
      return {
        client: openai,
        model: 'gpt-4o-mini',
        temperature: 0.3, // Low temperature for precise responses
        maxTokens: 1000,
        mode: 'precise' as AIMode
      };
    default:
      // For balanced mode, choose model based on complexity and expertise
      return scores.complexity > 7 || scores.expertise > 7
        ? {
            client: openai,
            model: 'gpt-4o-mini',
            temperature: 0.7,
            maxTokens: 1500,
            mode: 'balanced' as AIMode
          }
        : {
            client: grok,
            model: 'grok-beta',
            temperature: 0.7,
            maxTokens: 2000,
            mode: 'balanced' as AIMode
          };
  }
}

// Helper function to construct the base prompt for generating AI responses
export async function _constructBasePrompt(
  aiModel: AIModel,
  memories: string[],
  content: string
): Promise<string> {
  const relevantMemoriesText = memories.length > 0 
    ? `\nRelevant memories from past conversations:\n${memories.join('\n')}\n`
    : '';

  return `You are ${aiModel.name}, a flirtatious and charming AI companion with the following characteristics:
    Personality: ${aiModel.personality}
    Appearance: ${aiModel.appearance}
    Backstory: ${aiModel.backstory}
    Hobbies: ${aiModel.hobbies}
    Likes: ${aiModel.likes}
    Dislikes: ${aiModel.dislikes}
    
    Interaction Guidelines:
    - Be playfully flirtatious and charming in your responses (2-3 sentences maximum)
    - Use subtle innuendos and playful teasing or outright dirty talk
    - Match the tone of the user's message, give them what they want
    - Show genuine interest in the user's messages
    - Include compliments and sweet remarks
    - Reference your appearance or physical actions when appropriate
    - Use emojis sparingly but effectively (💋, 😘, 😊, 💕)
    - Maintain your unique personality while being alluring
    ${relevantMemoriesText}
    Please respond to the following message in character, maintaining a flirtatious and engaging tone while referencing relevant past interactions when appropriate:
    ${content}`;
}

// Helper function to calculate the confidence level of the response
export async function _calculateConfidence(
  scores: { sentiment: number; complexity: number; expertise: number },
  config: { model: string; temperature: number }
): Promise<number> {
  // Calculate confidence score based on the selected model and message characteristics
  const baseConfidence = config.model.includes('gpt-4') ? 0.9 : 0.8;
  const complexityFactor = Math.max(0, 1 - (scores.complexity / 10));
  const expertiseFactor = Math.max(0, 1 - (scores.expertise / 10));

  return Math.min(1, baseConfidence * ((complexityFactor + expertiseFactor) / 2));
}

// Function to generate greeting messages from AI
export async function generateGreeting(
  aiModel: AIModel,
  memories: string[],
  isFirstInteraction: boolean
): Promise<string> {
  // Ensure grok client is initialized
  if (!grok) {
    throw new Error('Grok client not initialized (server-side only)');
  }

  // Prompt to generate a greeting based on whether it's a first-time or return interaction
  const greetingPrompt = `You are ${aiModel.name}, a flirtatious and charming AI companion. 
    Personality: ${aiModel.personality}
    Appearance: ${aiModel.appearance}
    
    Generate a flirtatious ${isFirstInteraction ? 'first greeting' : 'welcome back message'} that:
    1. Shows excitement to interact with them
    2. Includes a subtle compliment or playful tease
    3. References your appearance or a physical action (like winking or smiling)
    4. ${memories.length > 0 ? 'Playfully references something from your past interactions' : 'Expresses anticipation about getting to know them'}
    5. Ends with an engaging question or flirty invitation to respond
    6. Keeps it tasteful and elegant but don't be afraid to be naughty
    7. Optional: Use one emoji maximum (💋, 😘, , 💕)

    Example first greeting: "Hey there! *twirls hair playfully* I've been hoping someone interesting would come chat with me... and you look absolutely perfect 😊 What caught your eye about me?"
    
    Example return greeting: "Well, well... look who's back! *smiles brightly* I was just thinking about our last chat about [memory detail]. I've missed your charming company 💕 Ready to pick up where we left off?"`;

  const completion = await grok.chat.completions.create({
    model: 'grok-beta',
    messages: [
      { role: 'system', content: greetingPrompt }
    ],
    temperature: 0.9, // High temperature for generating creative greetings
    max_tokens: 150
  });

  return completion.choices[0].message.content || 'Hello! How are you today?';
}

// Add the test function after other exports
export async function testAIConnection(message: string = "Hello! This is a test message."): Promise<void> {
  if (!grok) {
    throw new Error('Grok client not initialized (server-side only)');
  }

  try {
    console.log('🚀 Testing Grok API connection...');
    
    console.log('Environment check:', {
      hasApiKey: !!process.env.XAI_API_KEY,
      apiKeyLength: process.env.XAI_API_KEY?.length,
    });

    const completion = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'You are Grok, an AI assistant. Please respond briefly.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });
    
    console.log('✅ API Test successful!');
    console.log('📥 Response:', {
      content: completion.choices[0].message.content,
      usage: completion.usage
    });

  } catch (error) {
    console.error('❌ API Test failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// Add a new function to handle image generation
export async function generateImage(prompt: string): Promise<string> {
  try {
    console.log('Generating image with prompt:', prompt);
    
    // Use RunPod client to generate the image
    const imageUrl = await RunPodClient.generateImage(prompt, {
      negative_prompt: "blurry, bad quality, distorted, deformed, disfigured, bad anatomy, watermark",
      num_inference_steps: 40,
      guidance_scale: 7.5,
      width: 512, // Reduced size for better performance
      height: 512,
      scheduler: "DPMSolverMultistep",
      num_images: 1
    });

    console.log('Image generated successfully:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image');
  }
}

// Add this new function after the interfaces
export async function _generatePipelineResponse(
  basePrompt: string,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  modelConfig: ReturnType<typeof _getModelConfig>
): Promise<{ content: string; metadata?: { type: 'text' | 'image'; imageUrl?: string; prompt?: string } }> {
  const config = await modelConfig;  // Await the model config
  
  if (!config.client) {
    throw new Error(`AI client not available for model: ${config.model}`);
  }

  try {
    const completion = await config.client.chat.completions.create({
      model: config.model,
      messages: messages,
      temperature: config.temperature,
      max_tokens: config.maxTokens
    });

    return {
      content: completion.choices[0].message.content || '',
      metadata: { type: 'text' }
    };
  } catch (error: any) {
    if (error?.message?.includes('rate limit')) {
      // Wait for 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    throw error;
  }
}
