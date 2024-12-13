'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';

interface EmailLog {
  id: string;
  template: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string;
  metadata?: any;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

export function EmailLogs() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['emailLogs', page, status, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(status !== 'all' && { status }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/email-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch email logs');
      return response.json();
    },
  });

  const getStatusBadge = (status: EmailLog['status']) => {
    const variants: Record<EmailLog['status'], 'default' | 'destructive' | 'secondary'> = {
      PENDING: 'secondary',
      SENT: 'default',
      FAILED: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (error) {
    return <div>Error loading email logs</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Search emails..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No email logs found
                </TableCell>
              </TableRow>
            ) : (
              data?.logs.map((log: EmailLog) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">{log.template}</TableCell>
                  <TableCell>{log.subject}</TableCell>
                  <TableCell>{log.user.email}</TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          {data?.total} total logs
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.hasMore}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
} 