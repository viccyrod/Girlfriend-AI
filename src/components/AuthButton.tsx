'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/auth-screen/AuthDialog";
import Link from 'next/link';

interface AuthButtonProps {
  isAuthenticated: boolean;
}

export default function AuthButton({ isAuthenticated }: AuthButtonProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  if (isAuthenticated) {
    return (
      <Link href="/community/create-ai-model">
        <Button className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:transform hover:scale-105">
          <span className="mr-2">✨</span>
          Create your AI
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setIsAuthOpen(true)}
        className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:transform hover:scale-105"
      >
        <span className="mr-2">✨</span>
        Login / Sign Up
      </Button>
      <AuthDialog 
        isOpen={isAuthOpen}
        onOpenChange={setIsAuthOpen}
      />
    </>
  );
}
