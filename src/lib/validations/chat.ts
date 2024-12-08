import { z } from "zod";
import { Message } from "@/types/message";

export const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  userId: z.string().nullable(),
  chatRoomId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  aiModelId: z.string().nullable(),
  isAIMessage: z.boolean(),
  metadata: z.record(z.unknown()),
  role: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable()
  }).nullable(),
  aiModel: z.object({
    id: z.string(),
    name: z.string(),
    imageUrl: z.string()
  }).nullable()
});

export const AiModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string().nullable(),
  personality: z.string(),
  userId: z.string(),
  followerCount: z.number(),
  appearance: z.string(),
  backstory: z.string(),
  hobbies: z.string(),
  likes: z.string(),
  dislikes: z.string(),
  age: z.number().nullable(),
  isPrivate: z.boolean(),
  isAnime: z.boolean(),
  isHuman: z.boolean(),
  isHumanX: z.boolean(),
  isFollowing: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    imageUrl: z.string().nullable()
  })
});

export const ChatRoomSchema = z.object({
  id: z.string(),
  name: z.string(),
  aiModel: AiModelSchema,
  aiModelId: z.string(),
  aiModelImageUrl: z.string().nullable(),
  users: z.array(z.any()), // Replace with proper User schema
  messages: z.array(MessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    imageUrl: z.string().nullable()
  }).nullable()
});

export type AiModel = z.infer<typeof AiModelSchema>;
export type ChatRoom = z.infer<typeof ChatRoomSchema>; 