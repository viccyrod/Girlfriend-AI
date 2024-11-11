import { toast } from '@/hooks/use-toast';

export async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      lastError = error as Error;
      if (i === retries - 1) break;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  const errorMessage = lastError?.message || 'Failed to fetch';
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive',
  });
  throw new Error(`Failed after ${retries} retries. Last error: ${errorMessage}`);
} 