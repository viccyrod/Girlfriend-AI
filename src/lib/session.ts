import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from './clients/prisma';

export async function getCurrentUser() {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();
    
    if (!kindeUser || !kindeUser.id) return null;

    // Try to find existing user by ID first
    let user = await prisma.user.findUnique({
      where: { id: kindeUser.id }
    });

    // If not found by ID, try email
    if (!user && kindeUser.email) {
      user = await prisma.user.findUnique({
        where: { email: kindeUser.email }
      });

      // If found by email but ID doesn't match, update the ID
      if (user && user.id !== kindeUser.id) {
        user = await prisma.user.update({
          where: { email: kindeUser.email },
          data: { id: kindeUser.id }
        });
      }
    }

    // Create new user if not found
    if (!user && kindeUser.email) {
      user = await prisma.user.create({
        data: {
          id: kindeUser.id,
          email: kindeUser.email,
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
