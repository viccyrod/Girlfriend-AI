"use client"

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import React, { ReactNode } from 'react'
import Sidebar from './Sidebar'
import Suggested from './Suggested'

function BaseLayout({ children, renderRightPanel = true }: { children: ReactNode, renderRightPanel?: boolean }) {
  const { isAuthenticated, user } = useKindeBrowserClient();

  return (
    <div className='flex max-w-2x1 lg:max-w-7x1 mx auto releative'>
      <Sidebar />

      <div className="w-full lg:w-3/5 flex flex-col border-r"> {children}</div>
      {renderRightPanel && <Suggested />}
      {isAuthenticated && (
        <div>Welcome, {user?.given_name}</div>
      )}
    </div>
  );
}

export default BaseLayout;
