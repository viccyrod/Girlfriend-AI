import { redirect } from 'next/navigation';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import BaseLayout from '@/components/BaseLayout';
import { default as dynamicImport } from 'next/dynamic';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MyModelsClient = dynamicImport(() => import('@/components/MyModelsClient'), {
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
});

export default async function MyModelsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user?.id) redirect('/auth/login');

  return (
    <BaseLayout>
      <MyModelsClient user={user as any} />
    </BaseLayout>
  );
}
