import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const AIModelProfileSkeleton = () => {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <Skeleton className="h-64 w-full mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-1/3 mx-auto" />
        <div className="flex justify-center space-x-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIModelProfileSkeleton;

