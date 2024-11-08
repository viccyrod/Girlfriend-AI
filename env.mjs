import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Server-side environment variables schema
    OPENAI_API_KEY: z.string().min(1),
    PINECONE_API_KEY: z.string().min(1),
    RUNPOD_API_KEY: z.string().min(1),
    DATABASE_URL: z.string().url(),
    CLOUDINARY_API_KEY: z.string().min(1),
    CLOUDINARY_API_SECRET: z.string().min(1),
    // ... other server environment variables
  },
  client: {
    // Client-side environment variables schema (must start with NEXT_PUBLIC_)
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),
    // ... other public environment variables
  },
  // For Next.js >= 13.4.4, you only need to destructure client variables:
  experimental__runtimeEnv: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    // ... other public environment variables
  },
}); 