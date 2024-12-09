import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.runpod.ai/v2/sdxl/runsync', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: {
          prompt: prompt,
          negative_prompt: "nsfw, nude, naked, watermark, text, deformed, bad anatomy, disfigured",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 1024,
          height: 1024,
          seed: Math.floor(Math.random() * 1000000)
        }
      })
    });

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.error);
    }

    const imageUrl = result.output[0];

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
} 