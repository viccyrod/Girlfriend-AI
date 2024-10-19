import { Suspense } from 'react';
import HomeScreen from "@/components/home-screen/HomeScreen";
import AuthScreen from "@/components/auth-screen/AuthScreen";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { checkAuthStatus } from "./auth/callback/actions";

export default async function Home() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    console.log("User:", user); // Add this line

    if (user) {
      try {
        const result = await checkAuthStatus();
        console.log("checkAuthStatus result:", result);
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    }

    return (
      <main>
        <Suspense fallback={<div>Loading...</div>}>
          {user ? <HomeScreen /> : <AuthScreen />}
        </Suspense>
      </main>
    );
  } catch (error) {
    console.error("Error in Home component:", error);
    return <div>An error occurred. Please try again later.</div>;
  }
}
