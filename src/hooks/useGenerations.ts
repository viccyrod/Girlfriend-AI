import { useQuery } from '@tanstack/react-query';

interface GenerationStats {
  available: number;
  used: number;
  total: number;
}

export function useGenerations() {
  const { data, refetch } = useQuery<GenerationStats>({
    queryKey: ['generations'],
    queryFn: async () => {
      const response = await fetch('/api/generations');
      if (!response.ok) {
        throw new Error('Failed to fetch generations');
      }
      return response.json();
    }
  });

  return {
    generations: data,
    refresh: refetch,
    isLoading: !data
  };
} 