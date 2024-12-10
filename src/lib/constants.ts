import { GenerationType } from '@prisma/client';

export const TOKEN_COSTS: Record<GenerationType, number> = {
  CHAT: 1,
  IMAGE: 100,
  CHARACTER: 500
} as const;

type Package = {
  id: string;
  tokens: number;
  price: number;
  description: string;
  featured?: boolean;
  savings?: string;
};

export const CREDIT_PACKAGES: Package[] = [
  {
    id: 'starter',
    tokens: 1000,
    price: 5,
    description: 'Perfect for chatting: 1000 chat messages or 10 images',
  },
  {
    id: 'premium',
    tokens: 5000,
    price: 20,
    description: 'Most popular: 5000 chat messages, 50 images, or 10 characters',
    featured: true,
  },
  {
    id: 'pro',
    tokens: 12000,
    price: 40,
    description: 'Best value: 12000 chat messages, 120 images, or 24 characters',
  },
  {
    id: 'business',
    tokens: 50000,
    price: 150,
    description: 'For serious creators: 50000 chat messages, 500 images, or 100 characters',
    savings: '25% off',
  },
  {
    id: 'enterprise',
    tokens: 200000,
    price: 500,
    description: 'Ultimate package: 200000 chat messages, 2000 images, or 400 characters',
    savings: '37.5% off',
  },
] as const;

export const GENERATION_TYPES = {
  CHAT: 'CHAT',
  IMAGE: 'IMAGE',
  CHARACTER: 'CHARACTER',
} as const; 