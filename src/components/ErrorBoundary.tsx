import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { productionErrorReporting } from '@/utils/productionErrorReporting';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeout?: NodeJS.Timeout;
  
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Report to production error monitoring
    productionErrorReporting.reportError({
      message: error.message,
      stack: error.stack,
      severity: 'high',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        retryCount: this.state.retryCount
      }
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: undefined,
      retryCount: prevState.retryCount + 1 
    }));
    
    // Auto-retry with exponential backoff for critical errors
    if (this.state.retryCount < 3) {
      this.retryTimeout = setTimeout(() => {
        window.location.reload();
      }, Math.pow(2, this.state.retryCount) * 1000);
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="flex justify-center">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Что-то пошло не так
              </h1>
              <p className="text-muted-foreground">
                Приложение столкнулось с неожиданной ошибкой. Попробуйте обновить страницу.
              </p>
              
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <details className="mt-4 p-4 bg-muted rounded-md text-left text-sm">
                  <summary className="cursor-pointer font-medium">
                    Детали ошибки (только в режиме разработки)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={this.handleRetry}
                size="lg"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Попробовать снова
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                На главную
              </Button>
            </div>
            
            {this.state.retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Попыток восстановления: {this.state.retryCount}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;