import React, { useState, useEffect, useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import { ExtendedChatRoom } from '@/types/chat';
import { RunPodResponse } from '@/types/runpod';

interface ImageGenerationMenuProps {
  chatRoom: ExtendedChatRoom;
  onClose: () => void;
  setIsLoadingResponse: (loading: boolean) => void;
}

export function ImageGenerationMenu({ chatRoom, onClose, setIsLoadingResponse }: ImageGenerationMenuProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const options = [
    { label: "Show me a photo of you...", value: "show" },
    { label: "Send me a picture of you...", value: "send" },
    { label: "Can you show me how you look...", value: "look" },
    { label: "Generate an image of you...", value: "generate" },
  ];

  const handleImageGeneration = async (promptPrefix: string) => {
    try {
      setIsGenerating(true);
      setIsLoadingResponse(true);
      setError(null);

      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptPrefix + (customPrompt ? ` ${customPrompt}` : ''),
          chatRoomId: chatRoom.id,
          style: selectedStyle
        })
      });

      if (!response.ok) throw new Error('Failed to start image generation');
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Clear any existing interval
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/image?jobId=${data.jobId}&chatRoomId=${chatRoom.id}&messageId=${data.message.id}`);
          const statusData = await statusResponse.json();

          if (statusData.status === 'COMPLETED' || statusData.message?.metadata?.imageUrl) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
            }
            setIsGenerating(false);
            setIsLoadingResponse(false);
            setCustomPrompt('');
            onClose();
            return;
          }
        } catch (error) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
          setIsGenerating(false);
          setIsLoadingResponse(false);
          setError('Failed to check image status');
        }
      }, 2000);

    } catch (error) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      setIsGenerating(false);
      setIsLoadingResponse(false);
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-[#2a2a2a] rounded-full"
          disabled={isGenerating}
        >
          <ImageIcon className={`h-5 w-5 ${isGenerating ? 'text-muted' : 'text-[#ff4d8d]'}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] w-64">
        <div className="p-2">
          <Input
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Add details to your prompt..."
            className="bg-[#2a2a2a] border-none text-white"
            disabled={isGenerating}
          />
        </div>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleImageGeneration(option.label)}
            className="text-white hover:bg-[#2a2a2a] cursor-pointer"
            disabled={isGenerating}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
