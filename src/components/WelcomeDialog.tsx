'use client';

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, Camera, Users } from 'lucide-react';
import { motion } from "framer-motion";
import { TOKEN_COSTS } from "@/lib/constants";

interface WelcomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeDialog({ isOpen, onClose }: WelcomeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 space-y-6"
        >
          {/* Welcome Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <span className="font-semibold bg-gradient-to-r from-pink-500 to-purple-500 text-transparent bg-clip-text">
                  Welcome Gift: 1000 Tokens!
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-bold">Welcome to girlfriend.cx!</h2>
            <p className="text-muted-foreground">Here's how to get started with your tokens</p>
          </div>

          {/* Token Usage Guide */}
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <MessageSquare className="w-5 h-5 text-pink-500 mt-1" />
                <div>
                  <h3 className="font-medium">Chat with AI ({TOKEN_COSTS.CHAT} token)</h3>
                  <p className="text-sm text-muted-foreground">Send messages to your AI companions</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Camera className="w-5 h-5 text-purple-500 mt-1" />
                <div>
                  <h3 className="font-medium">Generate Images ({TOKEN_COSTS.IMAGE} tokens)</h3>
                  <p className="text-sm text-muted-foreground">Create custom images of your AI companions</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Users className="w-5 h-5 text-indigo-500 mt-1" />
                <div>
                  <h3 className="font-medium">Create Characters ({TOKEN_COSTS.CHARACTER} tokens)</h3>
                  <p className="text-sm text-muted-foreground">Design your own unique AI companions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Get Started Button */}
          <div className="flex justify-center">
            <Button 
              onClick={onClose}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 px-8"
            >
              Start Exploring
            </Button>
          </div>

          {/* Pro Tips */}
          <div className="text-center space-y-2 pt-4">
            <h4 className="text-sm font-medium">Pro Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Visit the Community tab to discover popular AI companions</li>
              <li>• Share with friends to earn bonus tokens</li>
              <li>• Check your token balance in the sidebar</li>
            </ul>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 