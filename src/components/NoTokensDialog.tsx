'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TokenIcon } from '@/components/TokenIcon';

interface NoTokensDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NoTokensDialog({ isOpen, onClose }: NoTokensDialogProps) {
  const router = useRouter();

  const handleGetTokens = () => {
    router.push('/settings/billing');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#0a0a0a] border-white/5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <TokenIcon className="w-5 h-5" />
            Out of Tokens
          </DialogTitle>
          <DialogDescription className="text-white/60">
            You've run out of tokens. Get more tokens to continue chatting and generating images.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
            <div className="text-sm text-white/80">
              <p>With tokens you can:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Send chat messages</li>
                <li>Generate AI images</li>
                <li>Create AI characters</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border-white/10 hover:bg-white/5 text-white/70 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGetTokens}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            Get More Tokens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 