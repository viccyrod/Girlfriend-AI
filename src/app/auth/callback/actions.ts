"use server";

import prisma from "@/db/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function checkAuthStatus() {
	try {
		const { getUser } = getKindeServerSession();
		const user = await getUser();

		if (!user) return { success: false };

		console.log("User from Kinde:", user);

		let dbUser = await prisma.user.findUnique({ where: { id: user.id } });

		if (!dbUser) {
			console.log("Creating new user in database");
			dbUser = await prisma.user.create({
				data: {
					id: user.id,
					email: user.email!,
					name: user.given_name + " " + user.family_name,
					image: user.picture,
				},
			});
		}

		console.log("User from database:", dbUser);
		return { success: true, user: dbUser };
	} catch (error) {
		console.error("Error in checkAuthStatus:", error);
		throw error;
	}
}
