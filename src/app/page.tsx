import HomeScreen from "@/components/home-screen/HomeScreen";
import AuthScreen from "@/components/auth-screen/AuthScreen";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { checkAuthStatus } from "./auth/callback/actions";

export default async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user) {
    const result = await checkAuthStatus();
    console.log("checkAuthStatus result:", result);
  };

  return (
    <main>
      {user ? <HomeScreen /> : <AuthScreen />}
    </main>
  );
}
