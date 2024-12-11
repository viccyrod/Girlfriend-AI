'use client';

import React from 'react';

export default function ChatRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-[calc(100vh-4rem)] bg-[#0a0a0a]">
      {children}
    </main>
  );
} 