import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from './clients/prisma';

export async function getCurrentUser() {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();
    
    if (!kindeUser || !kindeUser.id) return null;

    // Try to find existing user first
    let user = await prisma.user.findUnique({
      where: { email: kindeUser.email as string }
    });

    // Only create if user doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: kindeUser.id,
          email: kindeUser.email as string,
          name: kindeUser.given_name || kindeUser.family_name || 'Anonymous',
          image: kindeUser.picture || null
        }
      });
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}
