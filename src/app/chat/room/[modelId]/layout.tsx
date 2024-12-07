'use client';

import React from 'react';

export default function ChatRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {children}
    </div>
  );
} 