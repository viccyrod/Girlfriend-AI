import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from 'next/navigation';
import BaseLayout from '@/components/BaseLayout';
import { default as dynamicImport } from 'next/dynamic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
