import React, { Suspense } from "react";
import HomeScreen from "@/components/home-screen/HomeScreen";
import AuthScreen from "@/components/auth-screen/AuthScreen";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export default async function Home() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        {user ? <HomeScreen /> : <AuthScreen />}
      </Suspense>
    </main>
  );
}
