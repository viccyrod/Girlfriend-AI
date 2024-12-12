'use client';

import { useRouter } from 'next/navigation';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { Button } from '@/components/ui/button';
import { Sparkles, LogIn, Share2, QrCode, MessageCircle, ImageIcon, Wand2, MessageSquare, Heart, Users, Brain, Zap, Gift } from 'lucide-react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const FEATURED_MODELS = [
  { id: 1, name: "Luna", image: "/featured/1.jpg" },
  { id: 2, name: "Yui", image: "/featured/2.jpeg" },
  { id: 3, name: "Aria", image: "/featured/3.jpg" },
  { id: 4, name: "Nova", image: "/featured/4.png" },
  { id: 5, name: "Mia", image: "/featured/5.jpeg" },
  { id: 6, name: "Zara", image: "/featured/6.jpeg" }
];

interface ClaimData {
  referrerEmail?: string;
  expiresAt?: string;
}

type Props = {
  params: { code: string }
}

export default function ClaimPage({ params }: Props) {
  const router = useRouter();
  const { user } = useKindeBrowserClient();
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [hours, setHours] = useState("23");
  const [minutes, setMinutes] = useState("39");
  const [seconds, setSeconds] = useState("00");

  useEffect(() => {
    // Trigger confetti on load
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Fetch claim details
    const fetchClaimData = async () => {
      const res = await fetch(`/api/claim/${params.code}`);
      if (res.ok) {
        const data = await res.json();
        setClaimData(data);
      }
    };

    fetchClaimData();
  }, [params.code]);

  // Update countdown timer
  useEffect(() => {
    if (!claimData?.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(claimData.expiresAt!).getTime();
      const distance = expires - now;

      if (distance < 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [claimData?.expiresAt]);

  useEffect(() => {
    // Set the initial countdown time (24 hours from now)
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 24);

    const timer = setInterval(() => {
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference <= 0) {
        clearInterval(timer);
        setHours("00");
        setMinutes("00");
        setSeconds("00");
        return;
      }

      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setHours(h.toString().padStart(2, "0"));
      setMinutes(m.toString().padStart(2, "0"));
      setSeconds(s.toString().padStart(2, "0"));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // If user is already logged in, we can handle the claim
  if (user) {
    router.push(`/?claim=${params.code}`);
    return null;
  }

  const handleSignUp = () => {
    router.push(`/auth/login?claimCode=${params.code}`);
  };

  return (
    <div className="flex-1 py-12">
      <div className="container max-w-6xl mx-auto">
        {!user ? (
          <div className="space-y-12">
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <Image
                src="/logo-gradient.svg"
                alt="girlfriend logo"
                width={180}
                height={54}
                className="h-12 w-auto"
                priority
              />
            </div>

            {/* Hero Section */}
            <div className="text-center space-y-6 px-4 md:px-0">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Claim 1800 GOON Tokens!
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-400">
                Your Gateway to AI Romance & Adventure
              </h2>
              <p className="text-gray-400/90 max-w-2xl mx-auto">
                Join thousands of users exploring intimate connections with AI companions. Create, chat, and share moments with unique personalities.
              </p>
              
              {/* Timer Section */}
              <div className="mt-8">
                <div className="text-lg text-yellow-400 font-medium mb-4">Limited Time Offer</div>
                <div className="flex items-center justify-center gap-2 md:gap-4 text-white">
                  <div className="flex flex-col items-center">
                    <div className="text-3xl md:text-4xl font-bold bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-800">{hours}</div>
                    <div className="text-sm text-gray-400 mt-1">Hours</div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">:</div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl md:text-4xl font-bold bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-800">{minutes}</div>
                    <div className="text-sm text-gray-400 mt-1">Minutes</div>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold">:</div>
                  <div className="flex flex-col items-center">
                    <div className="text-3xl md:text-4xl font-bold bg-black/40 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-800">{seconds}</div>
                    <div className="text-sm text-gray-400 mt-1">Seconds</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Bonus Section */}
            <div className="mb-12 px-4 md:px-0">
              <div className="relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-sm border border-yellow-500/20 p-8 hover:border-yellow-500/40 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/20 via-transparent to-transparent"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/30 rounded-full blur-[128px] -z-10"></div>
                <div className="relative">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                    {/* Sign Up Bonus */}
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mr-3 border border-yellow-500/20">
                          <Gift className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                          1,200 Tokens
                        </h3>
                      </div>
                      <p className="text-base text-gray-400/90">Sign Up Bonus</p>
                    </div>

                    <div className="h-12 w-px bg-yellow-500/10 hidden md:block"></div>

                    {/* Referral Bonus */}
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center mr-3 border border-yellow-500/20">
                          <Share2 className="w-6 h-6 text-yellow-400" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                          600 Tokens
                        </h3>
                      </div>
                      <p className="text-base text-gray-400/90">Referral Bonus</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-yellow-500/10 text-center">
                    <p className="text-base text-gray-400/90">
                      Get started with <span className="text-yellow-400">1,200 tokens</span> when you sign up, plus earn an additional <span className="text-yellow-400">600 tokens</span> for using a referral link!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Models Section */}
            <div className="px-4 md:px-0 mb-12">
              <div className="relative overflow-hidden rounded-2xl border border-purple-500/10 p-6 md:p-8">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-transparent"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center border border-purple-500/10">
                        <Users className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Featured AI Companions
                      </h3>
                    </div>
                    <div className="hidden md:block text-sm text-purple-400/90">Always Online</div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-6">
                    {FEATURED_MODELS.map((model) => (
                      <div key={model.id} className="group relative">
                        <div className="aspect-square relative rounded-2xl overflow-hidden border-2 border-purple-500/10 group-hover:border-purple-500/20 transition-colors">
                          <Image
                            src={model.image}
                            alt={model.name}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {/* Online Indicator */}
                          <div className="absolute bottom-2 right-2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 border-2 border-black">
                            <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></div>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-sm font-medium text-gray-300">{model.name}</p>
                          <p className="text-xs text-green-400">Online</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 px-4 md:px-0">
              {/* Advanced AI Chat & Personalities Tile */}
              <div className="group relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-sm border border-purple-500/20 p-6 hover:border-purple-500/40 hover:bg-black/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[128px] -z-10"></div>
                <div className="relative flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mr-4 border border-purple-500/20">
                      <MessageSquare className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Advanced AI Chat
                    </h3>
                  </div>
                  <p className="text-base text-gray-400/90 leading-relaxed flex-grow">
                    Chat with 100+ unique AI personalities, each with their own interests and conversation style. Experience deep, meaningful conversations that adapt to you.
                  </p>
                  <div className="flex items-center gap-4 mt-6 pt-6 border-t border-purple-500/10">
                    
                    <div className="flex items-center text-sm text-pink-400/90">
                      <Users className="w-4 h-4 mr-2" />
                      <span>100+ Characters</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory & Learning Tile */}
              <div className="group relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-sm border border-purple-500/20 p-6 hover:border-purple-500/40 hover:bg-black/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-transparent"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[128px] -z-10"></div>
                <div className="relative flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mr-4 border border-purple-500/20">
                      <Brain className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Memory & Learning
                    </h3>
                  </div>
                  <p className="text-base text-gray-400/90 leading-relaxed flex-grow">
                    Your AI companions remember past conversations and evolve with you, creating deeper connections and more meaningful relationships over time.
                  </p>
                  <div className="flex items-center mt-6 pt-6 border-t border-purple-500/10">
                    <div className="flex items-center text-sm text-purple-400/90">
                      <Zap className="w-4 h-4 mr-2" />
                      <span>Persistent Memory</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uncensored AI Tile */}
              <div className="group relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-sm border border-rose-500/20 p-6 hover:border-rose-500/40 hover:bg-black/60 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 via-transparent to-transparent"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/30 rounded-full blur-[128px] -z-10"></div>
                <div className="relative flex flex-col h-full">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex items-center justify-center mr-4 border border-rose-500/20">
                      <ImageIcon className="w-6 h-6 text-rose-400" />
                    </div>
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                      Uncensored AI
                    </h3>
                  </div>
                  <p className="text-base text-gray-400/90 leading-relaxed flex-grow">
                    Generate intimate images and enjoy unrestricted 18+ conversations. No filters, complete creative freedom.
                  </p>
                  <div className="flex items-center mt-6 pt-6 border-t border-rose-500/10">
                    <div className="flex items-center text-sm text-rose-400/90">
                      <Sparkles className="w-4 h-4 mr-2" />
                      <span>The Only Limit is Your Imagination</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign Up Button */}
            <div className="text-center px-4 md:px-0">
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-6 px-8 rounded-xl w-full md:w-auto min-w-[200px]"
                onClick={() => {
                  const redirectUrl = `/claim/${params.code}`;
                  window.location.href = `${process.env.NEXT_PUBLIC_KINDE_SITE_URL}/auth/login?post_login_redirect_url=${encodeURIComponent(redirectUrl)}`;
                }}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign Up & Claim Tokens
              </Button>

              {/* Legal Confirmation */}
              <div className="mt-4 text-sm text-gray-400">
                <p>
                  By claiming tokens, you confirm that you are at least 18 years old and agree to our{' '}
                  <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
} 