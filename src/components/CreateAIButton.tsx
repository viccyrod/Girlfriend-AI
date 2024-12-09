'use client';

import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useEffect, useState } from 'react';

export default function CreateAIButton() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useKindeBrowserClient();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setAuthChecked(true);
    }
  }, [isLoading]);

  const handleClick = () => {
    if (!authChecked) return;
    
    if (isAuthenticated) {
      router.push('/community/create-ai-model');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={!authChecked}
      className="relative group px-8 py-6 overflow-hidden bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(255,77,141,0.3)] hover:shadow-[0_0_25px_rgba(255,77,141,0.5)] z-10"
    >
      <span className="relative z-10 text-lg font-semibold">
        Create Your Own
      </span>
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-600/20 blur-xl group-hover:blur-2xl transition-all duration-300" />
    </Button>
  );
}