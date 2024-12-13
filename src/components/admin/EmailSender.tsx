'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  template: z.enum(['welcome', 'reset-password', 'model-complete', 'token-low']),
  to: z.string().optional(),
  subject: z.string().min(1, 'Subject is required'),
  data: z.string().optional(),
  sendToAll: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface User {
  id: string;
  email: string;
  name: string;
}

export function EmailSender() {
  const [isSending, setIsSending] = useState(false);

  const { data: users, isLoading: isLoadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }
      return response.json();
    },
  });

  if (usersError) {
    toast({
      title: 'Error loading users',
      description: usersError instanceof Error ? usersError.message : 'Failed to load users',
      variant: 'destructive',
    });
  }

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template: 'welcome',
      to: '',
      subject: '',
      data: '',
      sendToAll: false,
    },
  });

  const sendToAll = form.watch('sendToAll');

  async function onSubmit(data: FormData) {
    setIsSending(true);
    try {
      // Parse the data JSON string if provided
      const parsedData = data.data ? JSON.parse(data.data) : undefined;

      if (data.sendToAll && users) {
        // Send to all users
        await Promise.all(
          users.map(user =>
            fetch('/api/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                template: data.template,
                to: user.email,
                subject: data.subject,
                data: { ...parsedData, name: user.name },
              }),
            })
          )
        );

        toast({
          title: 'Emails sent successfully',
          description: `Sent to ${users.length} users`,
        });
      } else {
        // Send to single user
        const response = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template: data.template,
            to: data.to,
            subject: data.subject,
            data: parsedData,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send email');
        }

        toast({
          title: 'Email sent successfully',
          description: `Email sent to ${data.to}`,
        });
      }

      // Reset form
      form.reset();

    } catch (error) {
      toast({
        title: 'Failed to send email',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="template"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Template</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="welcome">Welcome Email</SelectItem>
                    <SelectItem value="reset-password">Password Reset</SelectItem>
                    <SelectItem value="model-complete">Model Complete</SelectItem>
                    <SelectItem value="token-low">Low Token Alert</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose the email template to use
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sendToAll"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Send to all users {!isLoadingUsers && `(${users?.length || 0} users)`}
                    {isLoadingUsers && <Loader2 className="ml-2 h-4 w-4 inline animate-spin" />}
                  </FormLabel>
                  <FormDescription>
                    This will send the email to all registered users
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {!sendToAll && (
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Email</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingUsers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the recipient from the list
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Email subject" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Template Data (JSON)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='{
  "name": "John",
  "modelName": "AI Model",
  "modelId": "123",
  "tokens": 100
}'
                    className="font-mono"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter the template data in JSON format (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSending || isLoadingUsers}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {sendToAll ? (
              <>
                <Users className="mr-2 h-4 w-4" />
                Send to All Users
              </>
            ) : (
              'Send Email'
            )}
          </Button>
        </form>
      </Form>
    </Card>
  );
} 