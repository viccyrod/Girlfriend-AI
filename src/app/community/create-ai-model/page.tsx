import { redirect } from 'next/navigation';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { default as dynamicImport } from 'next/dynamic';
import BaseLayout from '@/components/BaseLayout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Dynamically import the client components
const CreateAIModelClient = dynamicImport(
  () => import('@/components/create-ai-model/CreateAIModelClient'),
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

export default async function CreateAIModelPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user?.id) redirect('/api/auth/login');

  return (
    <BaseLayout requireAuth={true}>
      <CreateAIModelClient user={user as any} />
    </BaseLayout>
  );
}
