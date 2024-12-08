import { createParser } from 'eventsource-parser';

export interface OpenAIStreamConfig {
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  top_p?: number;
}

export async function OpenAIStream(config: OpenAIStreamConfig) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: config.messages,
      stream: true,
      temperature: config.temperature || 1.0,
      max_tokens: config.max_tokens || 150,
      presence_penalty: config.presence_penalty || 0.9,
      frequency_penalty: config.frequency_penalty || 0.9,
      top_p: config.top_p || 0.9
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error! status: ${res.status}`);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: { type: string; data: string }) => {
        if (event.type === 'event') {
          const data = event.data;
          if (data === '[DONE]') {
            controller.close();
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = json.choices[0]?.delta?.content || '';
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse as any);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
} 