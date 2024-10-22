import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingIndicator = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-50">
      <div className="h-full bg-primary animate-pulse"></div>
      <Loader2 className="animate-spin text-primary absolute top-2 right-2" />
    </div>
  );
};

export default LoadingIndicator;
