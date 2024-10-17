import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "@/db/prisma";

export async function getCurrentUser() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    // Create the user if they don't exist in the database
    return await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.given_name,
      },
    });
  }

  return dbUser;
}
