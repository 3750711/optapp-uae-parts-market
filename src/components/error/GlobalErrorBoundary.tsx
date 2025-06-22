
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  errorId: string;
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
      isRecovering: false,
      errorId: ''
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
    
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return { 
      hasError: true, 
      error,
      isModuleLoadError,
      isPermissionError,
      isNetworkError,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Простое логирование в консоль
    console.error('Critical error caught:', error, {
      componentStack: errorInfo.componentStack,
      isAdminRoute: this.props.isAdminRoute,
      pathname: window.location.pathname,
      errorId: this.state.errorId
    });

    this.setState({ errorInfo });
    
    // Auto-handle chunk load errors
    if (this.state.isModuleLoadError) {
      this.handleChunkErrorWithDelay();
    }
  }

  handleChunkErrorWithDelay = () => {
    this.setState({ isRecovering: true });
    
    this.recoveryTimeout = window.setTimeout(() => {
      this.handleChunkError();
    }, 2000);
  };

  handleChunkError = async () => {
    try {
      console.log('🔄 Attempting automatic recovery...');
      
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Preserve auth data
      const authKeys = ['supabase.auth.token', 'sb-auth-token'];
      const authData: Record<string, string | null> = {};
      authKeys.forEach(key => {
        authData[key] = localStorage.getItem(key);
      });
      
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore auth data
      Object.entries(authData).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });
      
      window.location.reload();
    } catch (error) {
      console.error('Recovery failed:', error);
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

      // Auto-recovery in progress
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
              <div className="text-xs text-gray-500">
                ID ошибки: {this.state.errorId}
              </div>
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
                  У вас нет прав для доступа к административной панели.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={this.handleGoToProfile}
                className="w-full"
              >
                Вернуться в профиль
              </Button>
              <div className="text-xs text-gray-500 text-center">
                ID ошибки: {this.state.errorId}
              </div>
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
                <AlertTitle>Обновление приложения</AlertTitle>
                <AlertDescription>
                  Обнаружена новая версия приложения. Требуется обновление.
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

      // General error
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Произошла ошибка</AlertTitle>
              <AlertDescription>
                Что-то пошло не так. Попробуйте обновить страницу.
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

            <div className="text-xs text-gray-500 text-center">
              ID ошибки: {this.state.errorId}
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
