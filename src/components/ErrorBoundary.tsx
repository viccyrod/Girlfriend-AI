'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error('Uncaught error:', error);
    toast({
      title: "Error",
      description: "Something went wrong. Please check the details below.",
      variant: "destructive",
    });
  }

  public componentDidUpdate(prevProps: Props) {
    // If we had an error but the child component has changed,
    // attempt to re-render with the new props
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false, error: null });
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <details className="mt-2 mb-4">
              <summary className="cursor-pointer hover:text-blue-500">Error details</summary>
              <pre className="mt-2 text-sm text-red-500 text-left">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    try {
      return this.props.children;
    } catch (error) {
      this.setState({ hasError: true, error: error instanceof Error ? error : new Error('Unknown error') });
      return null;
    }
  }
}