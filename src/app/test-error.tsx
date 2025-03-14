'use client';

import { Button } from "@/components/ui/button";

export default function TestError() {
  const handleTestError = () => {
    throw new Error('Test error page');
  };

  const handleTestPromiseError = () => {
    Promise.reject(new Error('Test promise rejection'));
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Test Error Page</h1>
      <div className="space-x-4">
        <Button onClick={handleTestError}>
          Test Regular Error
        </Button>
        <Button onClick={handleTestPromiseError}>
          Test Promise Error
        </Button>
      </div>
    </div>
  );
} 