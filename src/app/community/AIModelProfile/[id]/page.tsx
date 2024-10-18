'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AIModelProfile from '@/app/community/AIModelProfile';
import { fetchAIModel } from '@/lib/api/ai-models/index';
import BaseLayout from '@/components/BaseLayout';
import { useQuery } from '@tanstack/react-query';

export default function AIModelProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const { data: aiModel, isLoading, error } = useQuery({
    queryKey: ['aiModel', params.id],
    queryFn: () => fetchAIModel(params.id),
  });

  const handleClose = () => {
    router.push('/community');
  };

  if (isLoading) {
    return (
      <BaseLayout>
        <div>Loading...</div>
      </BaseLayout>
    );
  }

  if (error || !aiModel) {
    return (
      <BaseLayout>
        <div>AI Model not found or there was an error fetching the data.</div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout>
      <AIModelProfile aIModel={aiModel} onClose={handleClose} />
    </BaseLayout>
  );
}
