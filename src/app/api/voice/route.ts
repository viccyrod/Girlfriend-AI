import { NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { text, voiceId } = await req.json();

    if (!text || !voiceId) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // ElevenLabs API call
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY || '',
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          }
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate voice');
    }

    // Get the audio buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    return NextResponse.json({ 
      audioData: `data:audio/mpeg;base64,${base64Audio}` 
    });
    
  } catch (error) {
    console.error('Voice generation error:', error);
    return new NextResponse(
      "Failed to generate voice", 
      { status: 500 }
    );
  }
} 