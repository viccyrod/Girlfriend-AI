import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="text-center space-y-6 max-w-md mx-auto p-6 rounded-lg border bg-card shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-500">Authentication Error</h1>
          <p className="text-muted-foreground">
            Sorry, we couldn&apos;t authenticate you. Please try again.
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login">
            <Button variant="default" className="bg-primary hover:bg-primary/90">
              Try Again
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 