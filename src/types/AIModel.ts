export interface CreatedBy {
  name: string;
  id: string;
}

export interface AIModel {
  name: string;
  id: string;
  personality: string;
  appearance: string;
  backstory: string;
  hobbies: string;
  likes: string;
  dislikes: string;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  createdBy: Creator | string;
  followerCount: number;
  isFollowing: boolean;
}

export interface Creator {
  id: string;
  name: string;
}