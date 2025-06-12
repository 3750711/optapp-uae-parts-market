
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

export class AdminProductsErrorBoundary extends Component<Props, State> {
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
    console.error('AdminProductsErrorBoundary caught an error:', error, errorInfo);
    
    // Расширенное логирование для диагностики
    console.group('🔍 Products Page Error Details');
    console.error('Error:', error.message);
    console.error('Error name:', error.name);
    console.error('Stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Current pathname:', window.location.pathname);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    console.log('🔄 Retrying products page...');
    this.setState({ isRetrying: true });
    
    // Небольшая задержка для UX
    setTimeout(() => {
      this.setState({ 
        hasError: false, 
        error: null,
        isRetrying: false
      });
    }, 500);
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ошибка на странице управления товарами</AlertTitle>
              <AlertDescription>
                Произошла ошибка при загрузке страницы. Попробуйте обновить страницу или вернитесь назад.
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
