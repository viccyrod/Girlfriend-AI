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

  static async generateImage(prompt: string, options = {
    negative_prompt: "blurry, bad quality, distorted, deformed, disfigured, bad anatomy, watermark",
    num_inference_steps: 40,
    guidance_scale: 7.5,
    width: 1024,
    height: 1024,
    scheduler: "DPMSolverMultistep", // Better quality scheduler
    num_images: 1
  }): Promise<string> {
    console.log('🎨 RunPod generating image with prompt:', prompt);

    const response = await fetch(`${this.API_URL}/runsync`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ RunPod API error:', errorText);
      throw new Error(`Failed to generate image: ${errorText}`);
    }

    const data: RunPodResponse = await response.json();
    console.log('✅ RunPod response:', data); // Log full response
    
    if (data.status === 'FAILED') {
      throw new Error('Image generation failed');
    }

    console.log('🖼️ Generated image URL:', data.output.image);
    return data.output.image;
  }
}
