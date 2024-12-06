import React, { useState } from 'react';
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

export interface ImageGenerationMenuProps {
  onSelect: (prompt: string) => Promise<void>;
}

export default function ImageGenerationMenu({ onSelect }: ImageGenerationMenuProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  
  const options = [
    { label: "Show me a photo of you...", value: "show" },
    { label: "Send me a picture of you...", value: "send" },
    { label: "Can you show me how you look...", value: "look" },
    { label: "Generate an image of you...", value: "generate" },
  ];

  const handleImageGeneration = async (promptPrefix: string) => {
    try {
      setIsGenerating(true);
      const fullPrompt = customPrompt ? `${promptPrefix} ${customPrompt}` : promptPrefix;
      await onSelect(fullPrompt);
      setCustomPrompt('');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
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
