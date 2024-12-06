import { logger } from '@/lib/utils/logger';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
}

interface TextToSpeechRequest {
  text: string;
  model_id?: string;
  voice_settings?: VoiceSettings;
}

export class VoiceService {
  private static instance: VoiceService;
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  private constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      logger.warn({ message: 'ElevenLabs API key not found' });
    }
  }

  public static getInstance(): VoiceService {
    if (!VoiceService.instance) {
      VoiceService.instance = new VoiceService();
    }
    return VoiceService.instance;
  }

  public async textToSpeech(
    text: string,
    voiceId: string,
    modelId: string = 'eleven_monolingual_v1'
  ): Promise<ArrayBuffer> {
    try {
      const url = `${this.baseUrl}/text-to-speech/${voiceId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
          },
        } as TextToSpeechRequest),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      logger.error({ message: 'Error generating voice message'});
      throw error;
    }
  }

  public async getVoices(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error({ message: 'Error fetching voices'});
      throw error;
    }
  }
}
