import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/db/prisma";

export async function getCurrentUser() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.id) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return await prisma.user.create({
        data: {
          id: user.id,
          email: user.email ?? 'No email provided',
          name: user.given_name ?? 'No name provided',
        },
      });
    }

    return dbUser;
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}
