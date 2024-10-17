"use client";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { checkAuthStatus } from "./actions";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Page = () => {
	const router = useRouter();

	const { data, error } = useQuery({
		queryKey: ["authCheck"],
		queryFn: async () => {
			try {
				const result = await checkAuthStatus();
				console.log("Auth check result:", result);
				return result;
			} catch (error) {
				console.error("Error in auth check:", error);
				throw error;
			}
		},
	});

	useEffect(() => {
		if (data?.success !== undefined) {
			router.push("/");
		}
	}, [data?.success, router]);

	if (error) {
		console.error("Error in auth callback:", error);
		return <div>Error: {error.message}</div>;
	}

	return (
		<div className='mt-20 w-full flex justify-center'>
			<div className='flex flex-col items-center gap-2'>
				<Loader className='w-10 h-10 animate-spin text-muted-foreground' />
				<h3 className='text-xl font-bold'>Redirecting...</h3>
				<p>Please wait...</p>
			</div>
		</div>
	);
};

export default Page;
