
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { reportCriticalError } from '@/utils/errorReporting';

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
  isModuleLoadError: boolean;
  isPermissionError: boolean;
  isNetworkError: boolean;
  isRecovering: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private recoveryTimeout?: number;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      isModuleLoadError: false,
      isPermissionError: false,
      isNetworkError: false,
      isRecovering: false
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
    // Отправляем ошибку в систему мониторинга
    reportCriticalError(error, {
      componentStack: errorInfo.componentStack,
      isAdminRoute: this.props.isAdminRoute,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
    });

    // Диспатчим кастомный event для дополнительного мониторинга
    window.dispatchEvent(new CustomEvent('react-error', {
      detail: {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }
    }));
    
    this.setState({ errorInfo });
    
    // Auto-handle chunk load errors with delay
    if (this.state.isModuleLoadError) {
      this.handleChunkErrorWithDelay();
    }
  }

  handleChunkErrorWithDelay = () => {
    this.setState({ isRecovering: true });
    
    this.recoveryTimeout = window.setTimeout(() => {
      this.handleChunkError();
    }, 2000); // Даем пользователю время увидеть сообщение
  };

  handleChunkError = async () => {
    try {
      console.log('🔄 Attempting automatic recovery...');
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear localStorage and sessionStorage (осторожно с auth данными)
      const authKeys = ['supabase.auth.token', 'sb-auth-token'];
      const authData: Record<string, string | null> = {};
      authKeys.forEach(key => {
        authData[key] = localStorage.getItem(key);
      });
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Восстанавливаем auth данные
      Object.entries(authData).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });
      
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('Error during recovery:', error);
      window.location.reload();
    }
  };

  handleReload = () => {
    this.setState({ isRecovering: true });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleGoToProfile = () => {
    window.location.href = '/profile';
  };

  componentWillUnmount() {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Auto-recovery in progress for module loading errors
      if (this.state.isModuleLoadError && this.state.isRecovering) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full space-y-4 text-center">
              <div className="flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Обновление приложения</AlertTitle>
                <AlertDescription>
                  Обнаружена новая версия. Приложение автоматически обновляется...
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );
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

      // Module loading error with manual recovery option
      if (this.state.isModuleLoadError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Обновление приложения</AlertTitle>
                <AlertDescription>
                  Обнаружена новая версия приложения. Требуется обновление страницы.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={this.handleReload}
                className="w-full"
                disabled={this.state.isRecovering}
              >
                {this.state.isRecovering ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Обновление...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Обновить сейчас
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      }

      // General error with recovery options
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Что-то пошло не так</AlertTitle>
              <AlertDescription>
                Произошла неожиданная ошибка. Попробуйте обновить страницу или вернуться на главную.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
                disabled={this.state.isRecovering}
              >
                {this.state.isRecovering ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Обновить
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
                <pre className="mt-2 whitespace-pre-wrap text-xs overflow-auto max-h-40">
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
