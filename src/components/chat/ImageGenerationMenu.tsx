import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateImage } from '@/lib/ai-client';

export interface ImageGenerationMenuProps {
  onSelect: (prompt: string) => Promise<void>;
}

export default function ImageGenerationMenu({ onSelect }: ImageGenerationMenuProps) {
  const { toast } = useToast();
  const options = [
    { label: "Show me...", value: "show" },
    { label: "Send me...", value: "send" },
    { label: "Send...", value: "send_direct" },
    { label: "Can I see...", value: "request" },
  ];

  const handleImageGeneration = async (promptPrefix: string) => {
    try {
      const prompt = `${promptPrefix} a...`;
      const _result = await generateImage(prompt);
      
      onSelect(prompt);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-[#2a2a2a] rounded-full"
        >
          <ImageIcon className="h-5 w-5 text-[#ff4d8d]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleImageGeneration(option.label)}
            className="text-white hover:bg-[#2a2a2a] cursor-pointer"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
