'use server'

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

export async function getDbUser() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  
  if (!kindeUser?.id || !kindeUser.email) return null;

  // Find or create user in database
  const dbUser = await prisma.user.upsert({
    where: { id: kindeUser.id },
    update: {
      email: kindeUser.email,
      name: kindeUser.given_name && kindeUser.family_name
        ? `${kindeUser.given_name} ${kindeUser.family_name}`
        : kindeUser.email.split('@')[0],
      image: kindeUser.picture || null
    },
    create: {
      id: kindeUser.id,
      email: kindeUser.email,
      name: kindeUser.given_name && kindeUser.family_name
        ? `${kindeUser.given_name} ${kindeUser.family_name}`
        : kindeUser.email.split('@')[0],
      image: kindeUser.picture || null
    }
  });

  return dbUser;
} 