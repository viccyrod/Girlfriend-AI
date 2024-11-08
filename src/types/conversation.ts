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
