export interface RunPodResponse {
  id: string;
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  output?: {
    image: string;
  };
  statusDetail?: {
    error?: string;
  };
} 