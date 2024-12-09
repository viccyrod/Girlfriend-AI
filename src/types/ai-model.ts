import { AIModel as PrismaAIModel } from '@prisma/client';

export type AIModelWithStats = PrismaAIModel & {
  followerCount: number;
};

export type AIModelResponse = {
  id: string;
  name: string;
  personality: string | null;
  appearance: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
  followerCount: number;
}; 