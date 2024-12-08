import { redirect } from 'next/navigation';
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from '@/lib/clients/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function AuthCallback() {
	const { getUser } = getKindeServerSession();
	const user = await getUser();

	if (!user?.email) {
		redirect('/auth/login');
	}

	try {
		let dbUser = await prisma.user.findUnique({
			where: { email: user.email }
		});

		if (!dbUser) {
			dbUser = await prisma.user.create({
				data: {
					id: user.id,
					email: user.email,
					name: user.given_name && user.family_name
						? `${user.given_name} ${user.family_name}`
						: user.email.split('@')[0],
					image: user.picture || undefined,
				},
			});
		} else if (dbUser.id !== user.id) {
			// Update the user's ID if it doesn't match the Kinde ID
			dbUser = await prisma.user.update({
				where: { email: user.email },
				data: { id: user.id },
			});
		}

		redirect('/');
	} catch (error) {
		console.error('Error in auth callback:', error);
		redirect('/auth/error');
	}
}
