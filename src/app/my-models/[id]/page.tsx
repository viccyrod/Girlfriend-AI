import { redirect } from 'next/navigation';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/prisma';
import BaseLayout from '@/components/BaseLayout';
import ModelManagementClient from '@/components/my-models/ModelManagementClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function ModelManagementPage({ params }: { params: { id: string } }) {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  
  if (!kindeUser?.id) {
    console.log('No user found, redirecting to login');
    redirect('/api/auth/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: kindeUser.id }
  });

  if (!user) {
    console.log('No DB user found, redirecting to login');
    redirect('/api/auth/login');
  }

  try {
    console.log('Fetching model:', params.id);
    const model = await prisma.aIModel.findUnique({
      where: {
        id: params.id,
      },
      include: {
        _count: {
          select: {
            followers: true
          }
        }
      }
    });

    if (!model) {
      console.log('Model not found:', params.id);
      redirect('/my-models');
    }

    if (model.userId !== user.id) {
      console.log('Model does not belong to user:', params.id, 'User:', user.id);
      redirect('/my-models');
    }

    return (
      <BaseLayout>
        <ModelManagementClient model={model} user={user} />
      </BaseLayout>
    );
  } catch (error) {
    console.error('Error fetching model:', error);
    redirect('/my-models');
  }
}
