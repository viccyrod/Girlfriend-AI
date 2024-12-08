import { Button } from "@/components/ui/button";
import { ImageIcon, Loader2 } from "lucide-react";
import { ExtendedChatRoom } from "@/types/chat";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export interface ImageGenerationMenuProps {
  chatRoom: ExtendedChatRoom;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export function ImageGenerationMenu({
  chatRoom,
  onGenerate,
  isGenerating
}: ImageGenerationMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    
    await onGenerate(prompt.trim());
    setPrompt("");
    setIsOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-full hover:bg-pink-500/20"
        onClick={() => setIsOpen(true)}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-5 w-5 text-pink-500 animate-spin" />
        ) : (
          <ImageIcon className="h-5 w-5 text-pink-500" />
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Image</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!prompt.trim() || isGenerating}
                className="bg-pink-500/10 hover:bg-pink-500/20 text-pink-500"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
