import React, { useState, useRef } from 'react';
import { Mic, Square, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceMessageProps {
  onVoiceMessage: (audioBlob: Blob) => Promise<void>;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

export function VoiceMessage({ onVoiceMessage, isRecording, setIsRecording }: VoiceMessageProps) {
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioChunks([]);
        onVoiceMessage(audioBlob);
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isRecording ? (
        <>
          <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm text-red-500">{formatTime(recordingTime)}</span>
          </div>
          <Button
            onClick={stopRecording}
            size="icon"
            variant="destructive"
            className="rounded-full"
          >
            <Square className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <Button
          onClick={startRecording}
          size="icon"
          variant="ghost"
          className="rounded-full hover:bg-pink-500/20"
        >
          <Mic className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
