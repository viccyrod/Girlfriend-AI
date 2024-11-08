export interface Memory {
  content: string;
  pageContent: string;
  metadata: {
    aiModelId: string;
    userId: string;
  };
}
