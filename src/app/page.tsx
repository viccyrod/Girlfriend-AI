import HomeScreen from "@/components/home-screen/HomeScreen";
import AuthScreen from "@/components/auth-screen/AuthScreen";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <main>
      {user ? <HomeScreen /> : <AuthScreen />}
    </main>
  );
}
