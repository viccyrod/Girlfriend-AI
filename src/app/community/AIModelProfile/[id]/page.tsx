import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';
import { default as dynamicImport } from 'next/dynamic';
import prisma from '@/lib/clients/prisma';
import { Metadata, ResolvingMetadata } from 'next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const model = await prisma.aIModel.findUnique({
    where: { id: params.id },
    select: {
      name: true,
      personality: true,
      imageUrl: true,
      followerCount: true,
    }
  });

  if (!model) {
    return {
      title: 'AI Companion Not Found',
      description: 'The requested AI companion could not be found.',
    }
  }

  const description = model.personality?.slice(0, 155) + '...' || 'Connect with this unique AI companion on Girlfriend.cx';

  return {
    title: `${model.name} - AI Companion Profile | Girlfriend.cx`,
    description,
    openGraph: {
      title: `Meet ${model.name} on Girlfriend.cx`,
      description,
      images: [{
        url: model.imageUrl || '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: `${model.name}'s Profile Picture`
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Meet ${model.name} on Girlfriend.cx`,
      description,
      images: [model.imageUrl || '/placeholder.jpg'],
    },
  }
}

const AIModelProfileClient = dynamicImport(() => import('@/components/AIModelProfileClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce" />
        <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce [animation-delay:0.2s]" />
        <div className="w-4 h-4 rounded-full bg-[#ff4d8d] animate-bounce [animation-delay:0.4s]" />
      </div>
    </div>
  )
});

export default async function AIModelProfilePage({ params }: { params: { id: string } }) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user?.id) redirect('/auth/login');

  return (
    <BaseLayout>
      <AIModelProfileClient modelId={params.id} userId={user.id} />
    </BaseLayout>
  );
}
