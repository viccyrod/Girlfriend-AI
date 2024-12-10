import { trackGeneration } from '@/lib/generations';
import { GenerationType } from '@prisma/client';

// In your POST handler
const result = await generateCharacter(prompt); // Your existing generation logic
await trackGeneration(user.id, GenerationType.CHARACTER, prompt, result);