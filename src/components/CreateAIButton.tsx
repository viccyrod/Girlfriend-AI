'use client';

import { useRouter } from 'next/navigation';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "@/components/ui/button";

export default function CreateAIButton() {
  const router = useRouter();
  const { user, isLoading } = useKindeBrowserClient();

  const handleCreateAI = () => {
    if (!user && !isLoading) {
      router.push('/api/auth/login?post_login_redirect_url=/community/create-ai-model');
      return;
    }
    
    router.push('/community/create-ai-model');
  };

  return (
    <Button 
      onClick={handleCreateAI}
      className="bg-[#ff4d8d] hover:bg-[#ff3377] text-white px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 hover:transform hover:scale-105"
    >
      <span className="mr-2">✨</span>
      Create your AI
    </Button>
  );
}