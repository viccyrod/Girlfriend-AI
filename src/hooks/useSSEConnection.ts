import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SSEOptions {
  url: string;
  onMessage: (data: any) => void;
  onError?: (error: any) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  maxRetries?: number;
  retryDelay?: number;
  heartbeatTimeout?: number;
}

export const useSSEConnection = ({
  url,
  onMessage,
  onError,
  onConnectionChange,
  maxRetries = 5,
  retryDelay = 2000,
  heartbeatTimeout = 35000
}: SSEOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const isConnectingRef = useRef(false);

  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }
    heartbeatTimeoutRef.current = setTimeout(() => {
      console.warn('Heartbeat timeout, reconnecting...');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        setRetryCount(prev => prev + 1);
        connect();
      }
    }, heartbeatTimeout);
  }, [heartbeatTimeout]);

  const connect = useCallback(() => {
    if (isConnectingRef.current) return null;
    isConnectingRef.current = true;

    try {
      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Check if URL is still valid (room exists)
      fetch(url.replace('/subscribe', '')).then(response => {
        if (!response.ok) {
          console.log('[SSE] Room no longer exists, stopping reconnection attempts');
          isConnectingRef.current = false;
          return;
        }
      }).catch(() => {
        isConnectingRef.current = false;
      });

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
        onConnectionChange?.(true);
        resetHeartbeat();
        isConnectingRef.current = false;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle ping messages
          if (data.ping) {
            resetHeartbeat();
            return;
          }
          
          // Handle initial connection message
          if (data.connected) {
            setRetryCount(0);
            return;
          }
          
          onMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          onError?.(error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        setIsConnected(false);
        onConnectionChange?.(false);
        eventSource.close();
        isConnectingRef.current = false;
        
        // Check if component is still mounted and URL is valid before retrying
        if (retryCount < maxRetries && !eventSource.CLOSED) {
          // Clear any existing reconnect timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          // Linear backoff with small jitter
          const backoffDelay = retryDelay * (retryCount + 1) + (Math.random() * 1000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, backoffDelay);
        } else {
          if (retryCount >= maxRetries) {
            toast({
              title: "Connection Lost",
              description: "Unable to maintain connection. Please refresh the page.",
              variant: "destructive",
              duration: 5000
            });
          }
          onError?.(error);
        }
      };

      return eventSource;
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      onError?.(error);
      isConnectingRef.current = false;
      return null;
    }
  }, [url, onMessage, onError, retryCount, maxRetries, retryDelay, toast, onConnectionChange, resetHeartbeat]);

  useEffect(() => {
    const eventSource = connect();
    
    return () => {
      isConnectingRef.current = false;
      // Clean up all timeouts and connections
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { 
    isConnected, 
    retryCount,
    reconnect: useCallback(() => {
      setRetryCount(0);
      return connect();
    }, [connect])
  };
}; 