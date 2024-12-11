export interface AIModel {
  id: string;
  name: string;
  imageUrl: string | null;
  personality: string;
  appearance: string;
  backstory: string;
  hobbies: string;
  likes: string;
  dislikes: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdBy: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  } | null;
  isFollowing?: boolean;
} 