'use client';

import { Suspense } from 'react';
import { EmailLogs } from '@/components/admin/EmailLogs';
import { EmailSender } from '@/components/admin/EmailSender';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmailManagementPage() {
  return (
    <Tabs defaultValue="send" className="space-y-4">
      <TabsList>
        <TabsTrigger value="send">Send Email</TabsTrigger>
        <TabsTrigger value="logs">Email Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="send" className="space-y-4">
        <EmailSender />
      </TabsContent>

      <TabsContent value="logs" className="space-y-4">
        <Suspense fallback={<div>Loading logs...</div>}>
          <EmailLogs />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
} 