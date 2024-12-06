interface RunPodResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output?: {
    image: string;
  };
  statusDetail?: {
    error?: string;
  };
}

export class RunPodClient {
  private static readonly API_URL = 'https://api.runpod.ai/v2/a1gzps0inilt37';
  private static readonly API_KEY = process.env.RUNPOD_API_KEY;

  static async startImageGeneration(prompt: string, options = {
    negative_prompt: "blurry, bad quality, distorted, deformed, disfigured, bad anatomy, watermark",
    num_inference_steps: 40,
    guidance_scale: 7.5,
    width: 1024,
    height: 1024,
    scheduler: "DPMSolverMultistep",
    num_images: 1
  }): Promise<string> {
    console.log('🎨 RunPod starting image generation with prompt:', prompt);

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
    return jobId;
  }

  static async checkJobStatus(jobId: string): Promise<RunPodResponse> {
    console.log('🔍 Checking RunPod job status:', jobId);
    
    const response = await fetch(`${this.API_URL}/status/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ RunPod status check error:', errorText);
      throw new Error(`Status check failed: ${errorText}`);
    }

    const status = await response.json();
    console.log('✅ RunPod status:', status.status);
    return status;
  }
}
