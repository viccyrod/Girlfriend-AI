interface RunPodResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output: {
    image: string;
  };
}

export class RunPodClient {
  private static readonly API_URL = 'https://api.runpod.ai/v2/a1gzps0inilt37';
  private static readonly API_KEY = process.env.RUNPOD_API_KEY;
  private static readonly MAX_RETRIES = 30; // Maximum number of status check retries
  private static readonly RETRY_INTERVAL = 2000; // 2 seconds between retries
  private static readonly TIMEOUT = 60000; // 60 seconds timeout

  private static async checkStatus(jobId: string): Promise<RunPodResponse> {
    const response = await fetch(`${this.API_URL}/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${await response.text()}`);
    }

    return response.json();
  }

  private static async pollStatus(jobId: string): Promise<RunPodResponse> {
    let retries = 0;
    
    while (retries < this.MAX_RETRIES) {
      const status = await this.checkStatus(jobId);
      
      if (status.status === 'COMPLETED') {
        return status;
      }
      
      if (status.status === 'FAILED') {
        throw new Error('Image generation failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, this.RETRY_INTERVAL));
      retries++;
    }
    
    throw new Error('Image generation timed out');
  }

  static async generateImage(prompt: string, options = {
    negative_prompt: "blurry, bad quality, distorted, deformed, disfigured, bad anatomy, watermark",
    num_inference_steps: 40,
    guidance_scale: 7.5,
    width: 1024,
    height: 1024,
    scheduler: "DPMSolverMultistep",
    num_images: 1
  }): Promise<string> {
    console.log('🎨 RunPod generating image with prompt:', prompt);

    // Start the job
    const startResponse = await fetch(`${this.API_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.API_KEY}`
      },
      body: JSON.stringify({
        input: {
          prompt,
          ...options
        }
      })
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('❌ RunPod API error:', errorText);
      throw new Error(`Failed to start image generation: ${errorText}`);
    }

    const { id: jobId } = await startResponse.json();

    // Poll for completion with timeout
    try {
      const result = await Promise.race([
        this.pollStatus(jobId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Image generation timed out')), this.TIMEOUT)
        )
      ]) as RunPodResponse;

      console.log('✅ RunPod response:', result);
      return result.output.image;
    } catch (error) {
      console.error('❌ RunPod error:', error);
      throw error;
    }
  }
}
