
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
  isRecovering: boolean;
  retryCount: number;
}

export class RouteErrorBoundary extends Component<Props, State> {
  private recoveryTimeout?: number;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isChunkError: false,
      isRecovering: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunkError = error.message.includes('loading dynamically imported module') ||
                        error.message.includes('Failed to fetch dynamically imported module') ||
                        error.message.includes('Loading chunk') ||
                        error.message.includes('ChunkLoadError') ||
                        error.name === 'ChunkLoadError';
    
    return { 
      hasError: true, 
      error,
      isChunkError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Route error caught:', error, errorInfo);
    
    // Логирование для диагностики
    console.log('Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      pathname: window.location.pathname,
      timestamp: new Date().toISOString()
    });
    
    // Автоматическое восстановление для chunk ошибок
    if (this.state.isChunkError && this.state.retryCount < this.maxRetries) {
      this.handleChunkErrorWithDelay();
    }
  }

  handleChunkErrorWithDelay = () => {
    this.setState({ isRecovering: true });
    
    // Увеличиваем задержку с каждой попыткой
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 5000);
    
    this.recoveryTimeout = window.setTimeout(() => {
      this.handleChunkError();
    }, delay);
  };

  handleChunkError = async () => {
    try {
      console.log('🔄 Attempting chunk error recovery, attempt:', this.state.retryCount + 1);
      
      // Агрессивная очистка кэшей
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('✅ Browser caches cleared');
        } catch (cacheError) {
          console.warn('⚠️ Could not clear caches:', cacheError);
        }
      }
      
      // Очистка sessionStorage и части localStorage
      sessionStorage.clear();
      
      // Сохраняем критически важные данные
      const authKeys = ['supabase.auth.token', 'sb-auth-token'];
      const authData: Record<string, string | null> = {};
      authKeys.forEach(key => {
        authData[key] = localStorage.getItem(key);
      });
      
      // Очищаем localStorage, но восстанавливаем auth данные
      localStorage.clear();
      Object.entries(authData).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });
      
      console.log('✅ Storage cleared and auth data restored');
      
      // Перезагружаем страницу
      window.location.reload();
    } catch (error) {
      console.error('❌ Recovery failed:', error);
      // Fallback - простая перезагрузка
      window.location.reload();
    }
  };

  handleRetry = () => {
    if (this.state.isChunkError && this.state.retryCount >= this.maxRetries) {
      // Если исчерпаны попытки автовосстановления, принудительно перезагружаем
      this.handleChunkError();
      return;
    }

    this.setState(prevState => ({ 
      hasError: false, 
      error: null, 
      isChunkError: false,
      isRecovering: false,
      retryCount: prevState.retryCount + 1
    }));
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

      // Автоматическое восстановление для chunk ошибок
      if (this.state.isChunkError && this.state.isRecovering) {
        return (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <p className="text-gray-600">Обновление модулей...</p>
                <p className="text-sm text-gray-500 mt-1">
                  Попытка {this.state.retryCount + 1} из {this.maxRetries}
                </p>
              </div>
            </div>
          </div>
        );
      }

      // Chunk ошибка с возможностью ручного восстановления
      if (this.state.isChunkError) {
        return (
          <div className="flex items-center justify-center min-h-[200px] p-4">
            <div className="max-w-md w-full space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Обновление приложения</p>
                    <p className="text-sm">
                      Обнаружена новая версия приложения. Требуется обновление для продолжения работы.
                    </p>
                    {this.state.retryCount >= this.maxRetries && (
                      <p className="text-xs text-gray-600">
                        Автоматическое восстановление не удалось. Попробуйте обновить вручную.
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
              <Button 
                onClick={this.handleRetry}
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
                    Обновить приложение
                  </>
                )}
              </Button>
            </div>
          </div>
        );
      }

      // Обычная ошибка маршрута
      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Ошибка загрузки страницы. Попробуйте обновить или вернитесь назад.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Повторить
              </Button>
              <Button 
                onClick={() => window.history.back()}
                className="flex-1"
              >
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
