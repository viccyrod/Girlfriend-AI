import type { Message as PrismaMessage } from '@prisma/client';

export interface Message extends PrismaMessage {
  content: string;
  isAIMessage: boolean;
  createdAt: Date;
}

export interface ConversationContext {
  recentTopics: string[];
  mood: string;
  lastResponses: string[];
  personalityTraits: {
    playfulness: number;
    empathy: number;
    assertiveness: number;
  };
  memoryHighlights: {
    timestamp: Date;
    topic: string;
    importance: number;
  }[];
}

export type PersonalityMode = 'sensible' | 'crazy' | 'balanced';

export interface Conversation {
  companionId: string;
  userId: string;
  history: Array<{
    role: string;
    content: string;
  }>;
  sentiment: number;
  personalityShift: {
    openness: number;
    friendliness: number;
    assertiveness: number;
    quirkiness: number;
  };
  mode: PersonalityMode;
}
