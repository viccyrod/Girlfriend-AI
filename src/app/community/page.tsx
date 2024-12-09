import React from 'react';
import BaseLayout from "@/components/BaseLayout";
import dynamic from 'next/dynamic';
import prisma from '@/lib/prisma';
import { Metadata } from 'next';

// Page configuration for Next.js
export const runtime = 'nodejs';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'AI Companion Community | Girlfriend.cx',
  description: 'Explore our diverse community of AI companions. Find your perfect match among thousands of unique personalities, each with their own stories and interests.',
  openGraph: {
    title: 'AI Companion Community | Girlfriend.cx',
    description: 'Explore our diverse community of AI companions. Find your perfect match among thousands of unique personalities, each with their own stories and interests.',
    images: [{
      url: '/community-preview.jpg',
      width: 1200,
      height: 630,
      alt: 'Girlfriend.cx Community Preview'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Companion Community | Girlfriend.cx',
    description: 'Explore our diverse community of AI companions. Find your perfect match among thousands of unique personalities.',
    images: ['/community-preview.jpg'],
  },
}

// Dynamically import the CommunityContent component
const CommunityContent = dynamic(
  () => import('@/components/community/CommunityContent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce" />
          <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce [animation-delay:0.2s]" />
          <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    ),
  }
);

async function getAIModels() {
  const models = await prisma.aIModel.findMany({
    where: {
      isPrivate: false,
      createdBy: {
        isNot: null
      }
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
      followers: true,
    },
  });

  return models
    .filter((model): model is typeof model & { createdBy: { id: string; name: string } } => 
      model.createdBy !== null
    )
    .map((model) => ({
      ...model,
      followerCount: model.followers.length,
      followers: undefined,
    }));
}

export default async function CommunityPage() {
  const aiModels = await getAIModels();
  
  return (
    <BaseLayout>
      <CommunityContent initialModels={aiModels} filterIsAnime={false} />
    </BaseLayout>
  );
}
