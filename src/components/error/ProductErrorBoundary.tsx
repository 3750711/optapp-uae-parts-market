import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { reportError } from "@/utils/errorReporting";

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<any>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class ProductErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportError(error, {
      component: 'ProductErrorBoundary',
      errorInfo: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} onRetry={this.handleRetry} />;
      }

      return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription className="mt-2">
              An error occurred while loading the product. Please try again.
              {this.state.retryCount > 2 && (
                <p className="mt-2 text-sm">
                  If the problem persists, please contact support.
                </p>
              )}
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-4 mt-6">
            <Button onClick={this.handleRetry} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={this.handleGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ProductErrorBoundary;