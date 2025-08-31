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
  retryCount: number;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  private recoveryTimeout?: number;
  private readonly maxRetries = 3;

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
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isModuleLoadError = error.message.includes('loading dynamically imported module') ||
                             error.message.includes('Failed to fetch dynamically imported module') ||
                             error.message.includes('Loading chunk') ||
                             error.message.includes('ChunkLoadError') ||
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
    console.error('🚨 Global critical error:', error, {
      componentStack: errorInfo.componentStack,
      isAdminRoute: this.props.isAdminRoute,
      pathname: window.location.pathname,
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    this.setState({ errorInfo });
    
    // Auto-handle module load errors with retry mechanism
    if (this.state.isModuleLoadError && this.state.retryCount < this.maxRetries) {
      this.handleChunkErrorWithDelay();
    }
  }

  handleChunkErrorWithDelay = () => {
    this.setState({ isRecovering: true });
    
    // Exponential backoff with jitter
    const baseDelay = 2000;
    const delay = baseDelay * Math.pow(2, this.state.retryCount) + Math.random() * 1000;
    
    this.recoveryTimeout = window.setTimeout(() => {
      this.handleChunkError();
    }, Math.min(delay, 10000)); // Cap at 10 seconds
  };

  handleChunkError = async () => {
    try {
      console.log('🔄 Global error recovery attempt:', this.state.retryCount + 1);
      
      // Comprehensive cache clearing
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        } catch (e) {
          console.warn('Cache clearing failed:', e);
        }
      }
      
      // Clear service worker if present
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
        } catch (e) {
          console.warn('Service worker cleanup failed:', e);
        }
      }
      
      // Preserve critical auth and profile data
      const preservedLocalStorage: Record<string, string | null> = {};
      const preservedSessionStorage: Record<string, string | null> = {};
      
      // Preserve all auth and profile related data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.startsWith('profile_'))) {
          preservedLocalStorage[key] = localStorage.getItem(key);
        }
      }
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase') || key.startsWith('profile_'))) {
          preservedSessionStorage[key] = sessionStorage.getItem(key);
        }
      }
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Restore critical data
      Object.entries(preservedLocalStorage).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });
      
      Object.entries(preservedSessionStorage).forEach(([key, value]) => {
        if (value) sessionStorage.setItem(key, value);
      });
      
      console.log('✅ Storage cleared and auth preserved');
      
      // Force reload with cache busting
      const url = new URL(window.location.href);
      url.searchParams.set('_t', Date.now().toString());
      window.location.href = url.toString();
    } catch (error) {
      console.error('❌ Recovery failed, forcing reload:', error);
      window.location.reload();
    }
  };

  handleReload = () => {
    this.setState(prevState => ({ 
      isRecovering: true,
      retryCount: prevState.retryCount + 1
    }));
    
    setTimeout(() => {
      if (this.state.isModuleLoadError) {
        this.handleChunkError();
      } else {
        window.location.reload();
      }
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
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              </div>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Обновление приложения</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Обнаружена новая версия. Приложение автоматически обновляется...</p>
                    <p className="text-sm text-gray-600">
                      Попытка {this.state.retryCount + 1} из {this.maxRetries}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              <div className="text-xs text-gray-500">
                ID: {this.state.errorId}
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
                ID: {this.state.errorId}
              </div>
            </div>
          </div>
        );
      }

      // Module loading error with enhanced recovery
      if (this.state.isModuleLoadError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Обновление приложения</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Обнаружена новая версия приложения. Требуется обновление.</p>
                    {this.state.retryCount >= this.maxRetries && (
                      <p className="text-sm text-yellow-700">
                        Автоматическое восстановление не удалось. Попробуйте обновить вручную.
                      </p>
                    )}
                  </div>
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
              <div className="text-xs text-gray-500 text-center">
                ID: {this.state.errorId}
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
              ID: {this.state.errorId}
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
