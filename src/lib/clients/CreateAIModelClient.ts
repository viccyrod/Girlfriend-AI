import { AIModel } from '@prisma/client';

const INITIAL_POLL_INTERVAL = 2000; // Start with 2 second intervals
const MAX_POLL_INTERVAL = 5000; // Max 5 second intervals
const POLL_TIMEOUT = 90000; // 90 seconds total timeout
const BACKOFF_FACTOR = 1.5; // Increase interval by 50% each time

export class CreateAIModelClient {
  private pollInterval: number = INITIAL_POLL_INTERVAL;
  private startTime: number = 0;
  private modelId: string;
  private onProgress?: (progress: number) => void;
  private onError?: (error: Error) => void;

  constructor(
    modelId: string,
    onProgress?: (progress: number) => void,
    onError?: (error: Error) => void
  ) {
    this.modelId = modelId;
    this.onProgress = onProgress;
    this.onError = onError;
    this.startTime = Date.now();
  }

  private calculateProgress(): number {
    const elapsed = Date.now() - this.startTime;
    // Estimate progress based on typical completion times
    return Math.min(Math.floor((elapsed / POLL_TIMEOUT) * 100), 95);
  }

  async pollForCompletion(): Promise<AIModel> {
    let attempts = 0;

    while (true) {
      try {
        const response = await fetch(`/api/ai-models/${this.modelId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch model status');
        }

        const model: AIModel = await response.json();

        // Report progress
        if (this.onProgress) {
          const progress = model.status === 'COMPLETED' ? 100 : this.calculateProgress();
          this.onProgress(progress);
        }

        if (model.status === 'COMPLETED') {
          return model;
        }

        if (model.status === 'FAILED') {
          throw new Error('Model generation failed');
        }

        // Check timeout
        if (Date.now() - this.startTime > POLL_TIMEOUT) {
          throw new Error('Model generation timed out');
        }

        // Exponential backoff with max limit
        this.pollInterval = Math.min(
          this.pollInterval * BACKOFF_FACTOR,
          MAX_POLL_INTERVAL
        );

        await new Promise(resolve => setTimeout(resolve, this.pollInterval));
        attempts++;

      } catch (error) {
        if (this.onError) {
          this.onError(error instanceof Error ? error : new Error('Unknown error'));
        }
        throw error;
      }
    }
  }
} 