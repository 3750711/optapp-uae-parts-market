
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Extend Window types for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      parameters: Record<string, any>
    ) => void;
  }
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  isAdminRoute?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  isModuleLoadError: boolean;
  isPermissionError: boolean;
  isNetworkError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      retryCount: 0,
      isModuleLoadError: false,
      isPermissionError: false,
      isNetworkError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isModuleLoadError = error.message.includes('loading dynamically imported module') ||
                             error.message.includes('Failed to fetch dynamically imported module') ||
                             error.message.includes('Loading chunk') ||
                             error.name === 'ChunkLoadError';
    
    const isPermissionError = error.message.includes('permission') || 
                             error.message.includes('unauthorized') ||
                             error.message.includes('admin') ||
                             error.message.includes('access denied');
    
    const isNetworkError = error.message.includes('fetch') ||
                          error.message.includes('network') ||
                          error.message.includes('connection');
    
    return { 
      hasError: true, 
      error,
      isModuleLoadError,
      isPermissionError,
      isNetworkError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.group('🔍 GlobalErrorBoundary Error Details');
    console.error('Error:', error.message);
    console.error('Error name:', error.name);
    console.error('Stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Current pathname:', window.location.pathname);
    console.error('User agent:', navigator.userAgent);
    console.error('Timestamp:', new Date().toISOString());
    console.error('Admin route:', this.props.isAdminRoute);
    console.groupEnd();
    
    this.setState({ errorInfo });
    
    // Send error to analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          component_stack: errorInfo.componentStack,
          is_admin_route: this.props.isAdminRoute
        }
      });
    }

    // Auto-retry for certain error types
    if (this.state.retryCount < 2 && (this.state.isModuleLoadError || this.state.isNetworkError)) {
      this.retryTimeoutId = setTimeout(() => {
        this.handleRetry();
      }, 1000 * (this.state.retryCount + 1)); // Progressive delay
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    console.log('🔄 Retrying from GlobalErrorBoundary, attempt:', this.state.retryCount + 1);
    this.setState(prevState => ({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
      isModuleLoadError: false,
      isPermissionError: false,
      isNetworkError: false
    }));
  };

  handleReload = () => {
    console.log('🔄 Reloading page from GlobalErrorBoundary');
    window.location.reload();
  };

  handleGoHome = () => {
    console.log('🏠 Navigating to home from GlobalErrorBoundary');
    window.location.href = '/';
  };

  handleGoToProfile = () => {
    console.log('👤 Navigating to profile from GlobalErrorBoundary');
    window.location.href = '/profile';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Permission error for admin routes
      if (this.state.isPermissionError && this.props.isAdminRoute) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full space-y-4">
              <Alert variant="destructive">
                <Shield className="h-4 w-4" />
                <AlertTitle>Недостаточно прав доступа</AlertTitle>
                <AlertDescription>
                  У вас нет прав для доступа к административной панели. Обратитесь к администратору.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={this.handleGoToProfile}
                className="w-full"
              >
                Вернуться в профиль
              </Button>
            </div>
          </div>
        );
      }

      // Module loading error
      if (this.state.isModuleLoadError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ошибка загрузки</AlertTitle>
                <AlertDescription>
                  Не удалось загрузить компонент. Это может быть связано с проблемами сети или обновлением приложения.
                  {this.state.retryCount > 0 && ` (Попытка ${this.state.retryCount + 1}/3)`}
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex-1"
                  disabled={this.state.retryCount >= 2}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.state.retryCount >= 2 ? 'Превышен лимит' : 'Повторить'}
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  Перезагрузить
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // General error
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Что-то пошло не так</AlertTitle>
              <AlertDescription>
                Произошла неожиданная ошибка. Попробуйте обновить страницу или вернуться на главную.
                {this.state.retryCount > 0 && ` (Попытка ${this.state.retryCount + 1})`}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="flex-1"
                disabled={this.state.retryCount >= 2}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {this.state.retryCount >= 2 ? 'Превышен лимит' : 'Повторить'}
              </Button>
              <Button 
                onClick={this.handleGoHome}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                На главную
              </Button>
            </div>

            {this.props.showDetails && this.state.error && (
              <details className="text-sm text-gray-600 bg-white p-3 rounded border">
                <summary className="cursor-pointer font-medium">
                  Подробности ошибки
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
