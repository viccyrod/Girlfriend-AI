'use client';

import React from 'react';

export default function ChatRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-[100vw] overflow-hidden">
      <div className="flex-1 relative">
        {children}
      </div>
    </div>
  );
} 