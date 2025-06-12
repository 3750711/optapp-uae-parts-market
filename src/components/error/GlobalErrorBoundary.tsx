
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield } from 'lucide-react';
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
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null, 
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
    console.error('Timestamp:', new Date().toISOString());
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

    // Auto-handle chunk load errors
    if (this.state.isModuleLoadError) {
      console.log('🔄 Auto-handling chunk load error...');
      this.handleChunkError();
    }
  }

  handleChunkError = async () => {
    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ Cleared all caches');
      }
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Cleared storage');
      
      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      // Force reload anyway
      window.location.reload();
    }
  };

  handleReload = () => {
    console.log('🔄 Manual page reload');
    window.location.reload();
  };

  handleGoHome = () => {
    console.log('🏠 Navigating to home');
    window.location.href = '/';
  };

  handleGoToProfile = () => {
    console.log('👤 Navigating to profile');
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

      // Module loading error with auto-recovery
      if (this.state.isModuleLoadError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Обновление приложения</AlertTitle>
                <AlertDescription>
                  Обнаружена новая версия приложения. Страница будет автоматически обновлена.
                </AlertDescription>
              </Alert>
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600">Обновление...</span>
              </div>
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Обновить сейчас
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
              >
                <RefreshCw className="h-4 w-4 mr-2" />
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
