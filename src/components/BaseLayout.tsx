"use client";

import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import { useRouter } from 'next/navigation';
import React, { ReactNode, useEffect } from 'react'
import Sidebar from './Sidebar'

const BaseLayout = ({children, renderRightPanel=true}: {children:ReactNode, renderRightPanel?:boolean}) => {
    const { isAuthenticated, isLoading } = useKindeBrowserClient();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/");
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) return <div>Loading...</div>;

    return (
        <div className='flex max-w-2x1 lg:max-w-7x1 mx auto releative'>
            <Sidebar />
            <div className="w-full lg:w-3/5 flex flex-col border-r">{children}</div>
            {renderRightPanel && "Suggested Products"}
        </div>
    )
}

export default BaseLayout
