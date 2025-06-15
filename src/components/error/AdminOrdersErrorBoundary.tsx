
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { prodError } from '@/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class AdminOrdersErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true, 
      error,
      isRetrying: false
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    prodError(error, {
      context: 'AdminOrdersErrorBoundary',
      componentStack: errorInfo.componentStack
    });
  }

  handleRetry = () => {
    this.setState({ isRetrying: true });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ошибка на странице заказов</AlertTitle>
              <AlertDescription>
                Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернитесь назад.
                {this.state.error && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer">Техническая информация</summary>
                    <pre className="mt-1 whitespace-pre-wrap break-words">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                disabled={this.state.isRetrying}
                className="flex-1"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                {this.state.isRetrying ? 'Загрузка...' : 'Повторить'}
              </Button>
              <Button 
                onClick={this.handleGoBack}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
