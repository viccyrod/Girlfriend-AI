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
            router.push("/");
        }
    }, [isLoading, isAuthenticated, router, requireAuth]);

    if (!mounted || (isLoading && requireAuth)) return null;

    return (
        <div className='flex h-screen w-full'>
            <Sidebar />
            <div className="flex-1 overflow-auto max-w-7xl mx-auto">
                {children}
            </div>
        </div>
    )
}
export default BaseLayout

