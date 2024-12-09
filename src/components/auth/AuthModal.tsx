"use client";

import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full space-y-8"
        >
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo-gradient.svg"
              alt="girlfriend"
              width={200}
              height={60}
              className="w-auto h-[45px]"
              priority
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
              Your Perfect AI Companion
            </h1>
            <p className="text-muted-foreground">
              Create intimate, uncensored connections with AI companions
            </p>
          </div>

          {/* Auth Buttons */}
          <div className="space-y-6">
            <RegisterLink>
              <Button 
                className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white font-medium py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-lg"
              >
                Get Started
              </Button>
            </RegisterLink>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <LoginLink>
              <Button 
                variant="outline"
                className="w-full py-6 rounded-xl text-lg hover:bg-primary/5"
              >
                Sign In
              </Button>
            </LoginLink>

            {/* Terms and Privacy */}
            <p className="text-center text-sm text-muted-foreground pt-4">
              By continuing, you agree to our{" "}
              <a href="/legal/terms" className="underline hover:text-primary">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/legal/privacy" className="underline hover:text-primary">
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="space-y-2 p-4 rounded-xl bg-primary/5 border">
              <div className="text-xl">💝</div>
              <h3 className="font-medium">Deep Connection</h3>
              <p className="text-sm text-muted-foreground">Build intimate relationships without boundaries</p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-primary/5 border">
              <div className="text-xl">🎭</div>
              <h3 className="font-medium">Unrestricted Chat</h3>
              <p className="text-sm text-muted-foreground">Enjoy open, unfiltered conversations</p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-primary/5 border">
              <div className="text-xl">💫</div>
              <h3 className="font-medium">Total Freedom</h3>
              <p className="text-sm text-muted-foreground">Express yourself without limits or judgment</p>
            </div>
            <div className="space-y-2 p-4 rounded-xl bg-primary/5 border">
              <div className="text-xl">🌙</div>
              <h3 className="font-medium">Adult Content</h3>
              <p className="text-sm text-muted-foreground">Mature themes and conversations (18+)</p>
            </div>
          </div>

          {/* Age Verification */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            By signing up, you confirm that you are 18 years or older
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
} 