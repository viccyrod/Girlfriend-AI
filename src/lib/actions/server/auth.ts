'use server'

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

const INITIAL_TOKEN_AMOUNT = 1000;

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
      image: kindeUser.picture || null,
      tokens: INITIAL_TOKEN_AMOUNT // Give initial tokens to new users
    }
  });

  // If this is a new user (tokens were just set), create a welcome claim
  if (dbUser.tokens === INITIAL_TOKEN_AMOUNT) {
    await prisma.tokenClaim.upsert({
      where: { code: `WELCOME_${dbUser.id}` },
      update: {
        claimed: true,
        claimedById: dbUser.id,
        claimedAt: new Date()
      },
      create: {
        code: `WELCOME_${dbUser.id}`,
        amount: INITIAL_TOKEN_AMOUNT,
        claimed: true,
        claimedById: dbUser.id,
        claimedAt: new Date(),
        createdById: dbUser.id
      }
    });
  }

  return dbUser;
} 