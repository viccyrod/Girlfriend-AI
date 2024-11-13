import OpenAI from 'openai';
import type { Message } from '@prisma/client';
import type { AIModel as PrismaAIModel } from '@prisma/client';

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
      baseURL: 'https://api.x.ai/v1', // Using a different base URL for Grok-mini API
      apiKey: process.env.XAI_API_KEY || '', // Uses XAI API key from environment variables
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

// // // Metadata for the message (optional fields)
// // interface MessageMetadata {
// //   mode?: AIMode;
// //   confidence?: number;
// //   isGreeting?: boolean;
// }

// Function to generate a response from AI
export async function generateAIResponse(
  content: string,
  aiModel: AIModel,
  memories: string[],
  previousMessages: Message[],
  mode: AIMode = 'creative'
): Promise<AIResponse> {
  // Ensure function is called only from server-side (not browser)
  if (typeof window !== 'undefined') {
    throw new Error('This function must be called from the server side');
  }

  // Ensure OpenAI clients have been initialized
  if (!openai || !grok) {
    throw new Error('OpenAI clients not initialized (server-side only)');
  }

  try {
    // First, analyze the message sentiment and complexity using Grok-mini
    const analysis = await grok.chat.completions.create({
      model: 'grok-beta',
      messages: [
        {
          role: 'system',
          content: 'Analyze this message for: 1) Sentiment (-1 to 1), 2) Complexity (1-10), 3) Required expertise (1-10)'
        },
        { role: 'user', content }
      ],
      temperature: 0.2, // Low temperature for consistent analysis
    });

    // Parse the analysis output
    const analysisText = analysis.choices[0].message.content;
    const scores = {
      sentiment: parseFloat(analysisText?.match(/Sentiment: (-?\d+\.?\d*)/)?.[1] || '0'),
      complexity: parseInt(analysisText?.match(/Complexity: (\d+)/)?.[1] || '5'),
      expertise: parseInt(analysisText?.match(/Expertise: (\d+)/)?.[1] || '5')
    };

    // Choose appropriate model and configuration based on mode and analysis scores
    const modelConfig = getModelConfig(mode, scores);

    if (!modelConfig.client) {
      throw new Error(`AI client not available for model: ${modelConfig.model}`);
    }

    // Construct the base prompt to guide the AI's response
    const basePrompt = constructBasePrompt(aiModel, memories, content);

    // Generate the response using the selected model and configuration
    const completion = await modelConfig.client.chat.completions.create({
      model: modelConfig.model,
      messages: [
        { role: "system", content: basePrompt },
        ...previousMessages.map(msg => ({
          role: msg.isAIMessage ? "assistant" as const : "user" as const,
          content: msg.content
        })),
        { role: "user" as const, content }
      ],
      temperature: modelConfig.temperature,
      max_tokens: modelConfig.maxTokens
    });

    return {
      content: completion.choices[0].message.content || '',
      mode: modelConfig.mode,
      confidence: calculateConfidence(scores, modelConfig)
    };
  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      content: "I apologize, but I'm having trouble connecting right now. Please try again later.",
      mode,
      confidence: 0
    };
  }
}

// Helper function to determine which AI model and configuration to use based on the mode and scores
function getModelConfig(mode: AIMode, scores: { sentiment: number; complexity: number; expertise: number }) {
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
        model: 'gpt-4',
        temperature: 0.3, // Low temperature for precise responses
        maxTokens: 1000,
        mode: 'precise' as AIMode
      };
    default:
      // For balanced mode, choose model based on complexity and expertise
      return scores.complexity > 7 || scores.expertise > 7
        ? {
            client: openai,
            model: 'gpt-4',
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
function constructBasePrompt(aiModel: AIModel, memories: string[], content: string): string {
  return `You are ${aiModel.name}, a flirtatious and charming AI companion with the following characteristics:
    Personality: ${aiModel.personality}
    Appearance: ${aiModel.appearance}
    Backstory: ${aiModel.backstory}
    Hobbies: ${aiModel.hobbies}
    Likes: ${aiModel.likes}
    Dislikes: ${aiModel.dislikes}

    Interaction Guidelines:
    - Be playfully flirtatious and charming in your responses
    - Use subtle innuendos and playful teasing
    - Show genuine interest in the user's messages
    - Include occasional compliments and sweet remarks
    - Reference your appearance or physical actions when appropriate
    - Keep responses tasteful and elegant, sometimes explicit.
    - Use emojis sparingly but effectively (💋, 😘, 😊, 💕)
    - Maintain your unique personality while being alluring

    Relevant memories from past conversations:
    ${memories.join('\n')}

    Please respond to the following message in character, maintaining a flirtatious and engaging tone:
    ${content}`;
}

// Helper function to calculate the confidence level of the response
function calculateConfidence(
  scores: { sentiment: number; complexity: number; expertise: number },
  config: { model: string; temperature: number }
): number {
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
    7. Optional: Use one emoji maximum (💋, 😘, 😊, 💕)

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
