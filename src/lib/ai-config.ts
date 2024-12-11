// API Configuration
export const API_CONFIG = {
  baseUrl: 'https://api.x.ai/v1',
  models: {
    chat: 'grok-beta',
    image: 'dall-e-3'
  },
  maxTokens: 4096,
  timeout: 60000
};

// Model Parameters
export const MODEL_PARAMS = {
  chat: {
    temperature: 0.85,
    top_p: 0.95,
    presence_penalty: 0.6,
    frequency_penalty: 0.5,
    max_tokens: 800,
    stop: ["Human:", "Assistant:"]
  },
  image: {
    quality: "hd" as const,
    style: "vivid" as const,
    size: "1024x1024" as const
  }
};

// Image Generation Configuration
export const IMAGE_GEN_CONFIG = {
  // Base parameters
  negative_prompt: "blurry, bad quality, distorted, deformed, disfigured, bad anatomy, watermark, text, extra fingers, poorly drawn hands, poorly drawn face, mutation, mutated, extra limbs, ugly, poorly drawn, low quality, blurry, mutation, mutated, deformed, cross-eye, body out of frame, bad anatomy, floating limbs, disconnected limbs, long neck",
  num_inference_steps: 30,
  guidance_scale: 7.5,
  width: 1024,
  height: 1024,
  scheduler: "DPM++ 2M Karras",
  num_images: 1,
  
  // Quality settings
  upscale: true,
  denoise_strength: 0.7,
  
  // Style settings
  style_preset: "photographic",
  image_style: "portrait",
  
  // Safety settings
  safety_checker: true,
  nsfw_filter: true,
  
  // Performance settings
  use_cache: true,
  priority: "high",
  
  // Additional parameters for better results
  clip_skip: 2,
  restore_faces: true,
  tiling: false,
  enable_hr: true,
  hr_scale: 2,
  hr_upscaler: "4x-UltraSharp"
};

// Rate Limiting
export const RATE_LIMITS = {
  messagesPerMinute: 20,
  tokensPerMinute: 10000,
  imagesPerDay: 50
};

// Content Moderation
export const CONTENT_FILTERS = {
  maxMessageLength: 2000,
  maxContextLength: 32000,
  bannedWords: [
    "offensive",
    "inappropriate",
    "harmful"
  ],
  contentWarnings: [
    "sensitive",
    "mature",
    "controversial"
  ]
};

// Memory Settings
export const MEMORY_CONFIG = {
  maxMemories: 10,
  memoryTTL: 24 * 60 * 60, // 24 hours
  relevanceThreshold: 0.7,
  maxTokensPerMemory: 200
};

// Error Messages
export const ERROR_MESSAGES = {
  rateLimitExceeded: "You've reached the rate limit. Please try again later.",
  invalidInput: "Invalid input. Please check your message and try again.",
  serverError: "Something went wrong. Please try again later.",
  contentFiltered: "Your message contains inappropriate content.",
  tokenLimitExceeded: "Message too long. Please try a shorter message."
};

// Response Processing
export const RESPONSE_PROCESSING = {
  trimWhitespace: true,
  removeEmptyLines: true,
  maxConsecutiveNewlines: 2,
  formatMarkdown: true
}; 