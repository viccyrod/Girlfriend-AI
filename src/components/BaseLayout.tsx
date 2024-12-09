"use client";

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import Image from 'next/image';

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
            {/* Mobile Header */}
            <div className="lg:hidden flex justify-center items-center py-4 px-4 border-b border-[#1a1a1a]">
                <Image
                    src="/logo-gradient.svg"
                    alt="girlfriend.cx"
                    width={150}
                    height={45}
                    className="h-[30px] w-auto"
                    priority
                />
            </div>
            <div className='flex flex-1'>
                <Sidebar />
                <main className="flex-1 overflow-y-auto scrollbar-pretty">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default BaseLayout

