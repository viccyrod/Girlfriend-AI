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
        <div className='flex max-w-2xl lg:max-w-7xl mx-auto relative'>
            <Sidebar />
            <div className="w-full flex flex-col">
                {children}
            </div>
        </div>
    )
}

export default BaseLayout
