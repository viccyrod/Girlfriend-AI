"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { checkAuthStatus } from "@/app/auth/callback/actions";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import prisma from "@/db/prisma";

// import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

const Page = () => {
	const router = useRouter();
	const { data, isLoading } = useQuery({
		queryKey: ["authCheck"],
		queryFn: async () => await checkAuthStatus(),
	});

	useEffect(() => {
		if (data?.success) {
			// User is authenticated and saved in the database
			console.log("User data:", data.user);
			router.push("/");
		} else if (data?.success === false) {
			// Authentication failed
			router.push("/login");
		}
	}, [data, router]);

	if (isLoading) {
		return (
			<div className='mt-20 w-full flex justify-center'>
				<div className='flex flex-col items-center gap-2'>
					<Loader className='w-10 h-10 animate-spin text-muted-foreground' />
					<h3 className='text-xl font-bold'>Authenticating...</h3>
					<p>Please wait...</p>
				</div>
			</div>
		);
	}

	return null;
};
export default Page;
