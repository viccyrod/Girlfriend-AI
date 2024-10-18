export interface CreatedBy {
  name: string;
}

export interface AIModel {
  id: string;
  name: string;
  personality: string;
  imageUrl: string;
  createdBy: {
    name: string;
  };
  description?: string;
  traits?: string[];
  followers?: number;
  posts?: number;
}
