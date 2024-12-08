"use client";

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useEffect, useState } from 'react'
import Sidebar from './Sidebar'

interface BaseLayoutProps {
    children: ReactNode;
    requireAuth?: boolean;
}

const BaseLayout = ({ children, requireAuth = true }: BaseLayoutProps) => {
    const { isAuthenticated, isLoading } = useKindeBrowserClient();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && requireAuth) {
            router.push("/auth/login");
        }
    }, [isLoading, isAuthenticated, router, requireAuth]);

    if (!mounted || (isLoading && requireAuth)) return null;

    return (
        <div className='flex h-screen w-full overflow-hidden bg-[#0a0a0a]'>
            <Sidebar />
            <main className="flex-1 flex flex-col min-h-0">
                {children}
            </main>
        </div>
    )
}

export default BaseLayout

