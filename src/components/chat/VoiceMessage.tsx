import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceMessageProps {
  onVoiceMessage: (audioBlob: Blob) => Promise<void>;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  isLoading?: boolean;
  'aria-label'?: string;
}

export function VoiceMessage({ 
  onVoiceMessage, 
  isRecording, 
  setIsRecording, 
  isLoading, 
  'aria-label': ariaLabel 
}: VoiceMessageProps) {
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioChunks([]);
        await onVoiceMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isLoading}
        aria-label={ariaLabel || "Record voice message"}
        className={`p-2 ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
      >
        {isRecording ? (
          <Square className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
      {isRecording && (
        <span className="text-sm text-muted-foreground">
          {formatTime(recordingTime)}
        </span>
      )}
    </div>
  );
}
