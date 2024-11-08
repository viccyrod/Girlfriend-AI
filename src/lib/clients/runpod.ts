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

  static async generateImage(prompt: string): Promise<string> {
    const response = await fetch(`${this.API_URL}/runsync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.API_KEY}`
      },
      body: JSON.stringify({
        input: {
          prompt,
          negative_prompt: "blurry, bad quality, distorted",
          num_inference_steps: 30,
          guidance_scale: 4.5,
          width: 1024,
          height: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const data: RunPodResponse = await response.json();
    return data.output.image;
  }
}
