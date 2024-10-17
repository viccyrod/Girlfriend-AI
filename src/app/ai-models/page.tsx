'use client'

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import BaseLayout from "@/components/BaseLayout";
import AIModelCard from "@/components/ai-models/AiModelCard";

interface AIModel {
  id: string;
  name: string;
  description: string;
  personality: string;
  appearance: string;
  backstory: string;
  hobbies: string;
  likes: string;
  dislikes: string;
  imageUrl: string;
  createdBy: {
    name: string;
    image: string;
  };
}

const fetchAIModels = async (): Promise<AIModel[]> => {
  const response = await fetch('/api/ai-models');
  if (!response.ok) {
    throw new Error('Failed to fetch AI models');
  }
  return response.json();
};

const CommunityPage = () => {
  const { data: aiModels, isLoading, error } = useQuery<AIModel[]>({
    queryKey: ['aiModels'],
    queryFn: fetchAIModels,
  });

  return (
    <BaseLayout>
      <h1 className="text-2xl font-bold mb-4">AI Model Community</h1>
      {isLoading && <p>Loading AI Models...</p>}
      {error && <p>Error loading AI Models: {error.message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiModels && aiModels.map((model: AIModel) => (
          <AIModelCard key={model.id} model={model} />
        ))}
      </div>
    </BaseLayout>
  );
};

export default CommunityPage;