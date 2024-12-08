import { redirect } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import AuthScreen from "@/components/auth-screen/AuthScreen";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  // If user is already logged in, redirect to home
  if (user?.id) {
    redirect('/');
  }

  return <AuthScreen />;
} 