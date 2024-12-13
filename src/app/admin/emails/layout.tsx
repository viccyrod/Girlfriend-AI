'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Management</h1>
          <p className="text-muted-foreground">
            Send emails and monitor email activity
          </p>
        </div>
      </div>
      
      <hr className="my-6 border-t border-gray-200" />

      {children}
    </div>
  );
} 