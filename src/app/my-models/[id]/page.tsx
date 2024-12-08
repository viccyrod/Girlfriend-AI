import { redirect } from 'next/navigation';
import { getDbUser } from '@/lib/actions/server/auth';
import prisma from '@/lib/clients/prisma';
import EditAIModelClient from '@/components/my-models/EditAIModelClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function EditAIModelPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const user = await getDbUser();
  if (!user) redirect('/auth/login');

  const model = await prisma.aIModel.findUnique({
    where: { 
      id: params.id,
      userId: user.id // Ensure user owns the model
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      followers: true
    }
  });

  if (!model) redirect('/my-models');

  return <EditAIModelClient user={user} initialModel={model} />;
}
