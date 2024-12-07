import type { Message, ConversationContext } from '@/types/conversation';

class ConversationManager {
  private static readonly MAX_RECENT_TOPICS = 5;
  private static readonly MAX_LAST_RESPONSES = 5;
  private static readonly SIMILARITY_THRESHOLD = 0.65;
  private static readonly CONTEXT_EXPIRY = 3600000; // 1 hour in milliseconds

  private contexts: Map<string, ConversationContext> = new Map();
  private contextTimestamps: Map<string, number> = new Map();

  public getContext(chatRoomId: string): ConversationContext | null {
    this.cleanExpiredContexts();
    return this.contexts.get(chatRoomId) || null;
  }

  private cleanExpiredContexts() {
    const now = Date.now();
    Array.from(this.contextTimestamps.entries()).forEach(([chatRoomId, timestamp]) => {
      if (now - timestamp > ConversationManager.CONTEXT_EXPIRY) {
        this.contexts.delete(chatRoomId);
        this.contextTimestamps.delete(chatRoomId);
      }
    });
  }

  private initializeContext(chatRoomId: string, _aiPersonality?: string): ConversationContext {
    const context: ConversationContext = {
      recentTopics: [],
      mood: 'neutral',
      lastResponses: [],
      personalityTraits: {
        playfulness: 0.5,
        empathy: 0.5,
        assertiveness: 0.5
      },
      memoryHighlights: []
    };
    this.contexts.set(chatRoomId, context);
    this.contextTimestamps.set(chatRoomId, Date.now());
    return context;
  }

  public updateContext(chatRoomId: string, message: Message, _aiPersonality?: string) {
    const context = this.getContext(chatRoomId) || this.initializeContext(chatRoomId);
    const topics = this.extractTopics(message.content);
    
    // Update recent topics, keeping only unique values
    context.recentTopics = Array.from(new Set([...topics, ...context.recentTopics]))
      .slice(0, ConversationManager.MAX_RECENT_TOPICS);

    // Update mood based on message content and previous mood
    const newMood = this.analyzeMood(message.content);
    context.mood = this.smoothMoodTransition(context.mood, newMood);

    // Store response if it's an AI message
    if (message.isAIMessage) {
      context.lastResponses = [message.content, ...context.lastResponses]
        .slice(0, ConversationManager.MAX_LAST_RESPONSES);
    }

    // Update memory highlights
    if (this.isSignificantMessage(message.content)) {
      context.memoryHighlights.push({
        timestamp: new Date(message.createdAt),
        topic: this.extractMainTopic(message.content),
        importance: this.calculateImportance(message.content)
      });

      // Sort by importance and keep only top 10
      context.memoryHighlights.sort((a, b) => b.importance - a.importance)
        .slice(0, 10);
    }

    return context;
  }

  private smoothMoodTransition(currentMood: string, newMood: string): string {
    // Simple mood transition logic
    if (currentMood === newMood) return currentMood;
    
    const moodIntensity = {
      'neutral': 0,
      'happy': 1,
      'excited': 2,
      'sad': -1,
      'angry': -2
    };

    const current = moodIntensity[currentMood as keyof typeof moodIntensity] || 0;
    const target = moodIntensity[newMood as keyof typeof moodIntensity] || 0;
    
    // Gradually change mood
    const diff = target - current;
    const step = Math.sign(diff) * 1;
    const newIntensity = current + step;
    
    // Convert back to mood string
    return Object.entries(moodIntensity).find(([_, value]) => value === newIntensity)?.[0] || 'neutral';
  }

  public shouldPreventRepetition(chatRoomId: string, proposedResponse: string): boolean {
    const context = this.contexts.get(chatRoomId);
    if (!context) return false;

    return context.lastResponses.some(lastResponse => 
      this.calculateSimilarity(proposedResponse, lastResponse) > ConversationManager.SIMILARITY_THRESHOLD
    );
  }

  public getContextualResponse(chatRoomId: string, baseResponse: string): string {
    const context = this.contexts.get(chatRoomId);
    if (!context) return baseResponse;

    // Adjust response based on mood and personality
    let adjustedResponse = this.adjustTone(baseResponse, context.mood, context.personalityTraits);

    // Add contextual references
    if (context.recentTopics.length > 0) {
      adjustedResponse = this.addContextualReference(adjustedResponse, context);
    }

    return adjustedResponse;
  }

  private extractTopics(text: string): string[] {
    // Simplified topic extraction - in production, use a proper NLP library
    return text.toLowerCase()
      .split(/[,.!?]/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 3);
  }

  private analyzeMood(text: string): string {
    // Simplified mood analysis - in production, use sentiment analysis
    const lowerText = text.toLowerCase();
    if (lowerText.includes('happy') || lowerText.includes('excited')) return 'positive';
    if (lowerText.includes('sad') || lowerText.includes('angry')) return 'negative';
    return 'neutral';
  }

  private isSignificantMessage(text: string): boolean {
    // Simplified significance check
    return text.length > 50 || text.includes('?') || text.includes('!');
  }

  private extractMainTopic(text: string): string {
    // Simplified topic extraction - implement more sophisticated NLP in production
    return text.split(' ').slice(0, 3).join(' ');
  }

  private calculateImportance(text: string): number {
    // Simplified importance calculation
    return Math.min(
      (text.length / 100) + 
      (text.split('?').length - 1) * 0.2 + 
      (text.split('!').length - 1) * 0.2,
      1
    );
  }

  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(' '));
    const words2 = new Set(text2.toLowerCase().split(' '));
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size);
  }

  private adjustTone(text: string, _mood: string, _personality: ConversationContext['personalityTraits']): string {
    // Implement tone adjustment based on mood and personality
    // This is a simplified version - implement more sophisticated tone adjustment in production
    return text;
  }

  private addContextualReference(text: string, _context: ConversationContext): string {
    // Add contextual references based on recent topics and memory
    // This is a placeholder - implement proper context integration in production
    return text;
  }
}

export const conversationManager = new ConversationManager();
