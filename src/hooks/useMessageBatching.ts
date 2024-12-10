import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/types/message';

interface BatchOptions {
  batchSize?: number;
  batchDelay?: number;
  onError?: (error: Error) => void;
}

export const useMessageBatching = (
  onBatch: (messages: Message[]) => void,
  { batchSize = 10, batchDelay = 100, onError }: BatchOptions = {}
) => {
  const [queue, setQueue] = useState<Message[]>([]);
  const queueRef = useRef<Message[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const processingRef = useRef(false);

  // Keep queueRef in sync with state
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const processBatch = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) return;

    try {
      processingRef.current = true;
      onBatch([...queueRef.current]);
      setQueue([]);
    } catch (error) {
      console.error('Error processing message batch:', error);
      onError?.(error as Error);
    } finally {
      processingRef.current = false;
    }
  }, [onBatch, onError]);

  const addMessage = useCallback((message: Message) => {
    setQueue(prev => {
      const newQueue = [...prev, message];
      
      // Process immediately if we hit batch size
      if (newQueue.length >= batchSize) {
        queueRef.current = newQueue;
        setTimeout(processBatch, 0);
        return [];
      }
      
      return newQueue;
    });

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout for processing
    batchTimeoutRef.current = setTimeout(processBatch, batchDelay);
  }, [batchSize, batchDelay, processBatch]);

  // Process remaining messages on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      if (queueRef.current.length > 0) {
        processBatch();
      }
    };
  }, [processBatch]);

  return addMessage;
}; 