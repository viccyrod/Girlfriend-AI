"use server";

import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function checkAuthStatus() {
	const { getUser } = getKindeServerSession();
	const user = await getUser();
  
	if (!user) return { success: false };
  
	try {
	  let dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  
	  if (!dbUser) {
		dbUser = await prisma.user.create({
		  data: {
			id: user.id,
			email: user.email!,
			name: user.given_name && user.family_name
			  ? `${user.given_name} ${user.family_name}`
			  : user.email!.split('@')[0],
			image: user.picture || undefined,
		  },
		});
	  } else if (dbUser.id !== user.id) {
		// Update the user's ID if it doesn't match the Kinde ID
		dbUser = await prisma.user.update({
		  where: { email: user.email! },
		  data: { id: user.id },
		});
	  }
  
	  return { success: true, user: dbUser };
	} catch (error) {
	  console.error("Error in checkAuthStatus:", error);
	  return { success: false, error: error as string };
	}
  }
