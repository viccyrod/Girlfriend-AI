"use client";

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Footer from './footer';

interface BaseLayoutProps {
    children: ReactNode;
    requireAuth?: boolean;
}

const BaseLayout = ({ children, requireAuth = false }: BaseLayoutProps) => {
    const { isAuthenticated, isLoading } = useKindeBrowserClient();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && requireAuth && mounted) {
            router.push('/auth/login');
        }
    }, [isLoading, isAuthenticated, requireAuth, mounted, router]);

    // Don't render anything while loading auth state
    if (!mounted || (isLoading && requireAuth)) return null;

    return (
        <div className='flex min-h-screen bg-[#0a0a0a] flex-col'>
            <div className='flex flex-1'>
                <Sidebar />
                <main className="flex-1 overflow-y-auto scrollbar-pretty">
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    )
}

export default BaseLayout

