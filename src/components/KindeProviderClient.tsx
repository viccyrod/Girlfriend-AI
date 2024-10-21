'use client';

import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";

export function KindeProviderClient({ children }: { children: React.ReactNode }) {
  return <KindeProvider>{children}</KindeProvider>;
}

