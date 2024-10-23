"use client";

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useEffect } from 'react'
import Sidebar from './Sidebar'

const BaseLayout = ({ children }: { children: ReactNode }) => {
    const { isAuthenticated, isLoading } = useKindeBrowserClient();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) return <div>Loading...</div>;

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
