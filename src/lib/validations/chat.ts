import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  chatRoomId: z.string(),
  role: z.enum(["user", "assistant"]),
  createdAt: z.date(),
  updatedAt: z.date(),
  user: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable()
  }).nullable(),
  aiModelId: z.string().nullable(),
  isAIMessage: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional()
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

export type Message = z.infer<typeof MessageSchema>;
export type AiModel = z.infer<typeof AiModelSchema>;
export type ChatRoom = z.infer<typeof ChatRoomSchema>; 