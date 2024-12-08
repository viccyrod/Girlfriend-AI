import { redirect } from 'next/navigation';
import { getDbUser } from '@/lib/actions/server/auth';
import CreatorStudioClient from '@/components/creator-studio/CreatorStudioClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function CreatorStudioPage() {
  const user = await getDbUser();
  if (!user) redirect('/auth/login');

  return <CreatorStudioClient user={user} />;
}
