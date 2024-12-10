'use server'

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/lib/clients/prisma";

export async function getDbUser() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user?.id) return null;

  // Only update user info if it has changed
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) {
    // New user - create with welcome tokens
    const newUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email || "",
        name: user.given_name || user.family_name || "",
        image: user.picture || "",
        tokens: 1000
      }
    });

    // Create welcome token claim
    await prisma.tokenClaim.create({
      data: {
        code: `WELCOME_${user.id}`,
        amount: 1000,
        claimed: true,
        claimedById: user.id,
        claimedAt: new Date(),
        createdById: user.id
      }
    });

    return newUser;
  }

  // Only update if user info has changed
  if (
    dbUser.email !== user.email ||
    dbUser.name !== (user.given_name || user.family_name || "") ||
    dbUser.image !== user.picture
  ) {
    return prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email || dbUser.email,
        name: user.given_name || user.family_name || dbUser.name,
        image: user.picture || dbUser.image
      }
    });
  }

  return dbUser;
} 