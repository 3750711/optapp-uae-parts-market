
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldX, AlertTriangle, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isPermissionError: boolean;
  isModuleLoadError: boolean;
  isChunkLoadError: boolean;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      isPermissionError: false,
      isModuleLoadError: false,
      isChunkLoadError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isPermissionError = error.message.includes('permission') || 
                             error.message.includes('unauthorized') ||
                             error.message.includes('admin');
    
    const isModuleLoadError = error.message.includes('loading dynamically imported module') ||
                             error.message.includes('Failed to fetch dynamically imported module') ||
                             error.name === 'ChunkLoadError';

    const isChunkLoadError = error.message.includes('Loading chunk') ||
                            error.message.includes('ChunkLoadError') ||
                            error.name === 'ChunkLoadError';
    
    return { 
      hasError: true, 
      error,
      isPermissionError,
      isModuleLoadError,
      isChunkLoadError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
    
    // Расширенное логирование для диагностики
    console.group('🔍 Admin Error Details');
    console.error('Error:', error.message);
    console.error('Error name:', error.name);
    console.error('Stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Error Info:', errorInfo);
    console.error('Current pathname:', window.location.pathname);
    console.error('User agent:', navigator.userAgent);
    console.error('Timestamp:', new Date().toISOString());
    console.groupEnd();
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Специальная обработка chunk loading errors
    if (this.state.isChunkLoadError || this.state.isModuleLoadError) {
      console.warn('🚨 Chunk/Module loading error detected. This might be caused by:');
      console.warn('- Network connectivity issues');
      console.warn('- Application update in progress');
      console.warn('- Browser cache issues');
      console.warn('- Large chunk size issues');
      console.warn('- Circular dependencies in code');
      
      // Попытка автоматического восстановления
      setTimeout(() => {
        this.handleRecovery();
      }, 1000);
    }
  }

  handleRetry = () => {
    console.log('🔄 Retrying from AdminErrorBoundary');
    this.setState({ 
      hasError: false, 
      error: null, 
      isPermissionError: false,
      isModuleLoadError: false,
      isChunkLoadError: false
    });
  };

  handleReload = () => {
    console.log('🔄 Reloading page from AdminErrorBoundary');
    window.location.reload();
  };

  handleRecovery = async () => {
    console.log('🔧 Attempting automatic recovery...');
    try {
      // Очистить кеши
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Принудительная перезагрузка
      window.location.reload();
    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError);
      // Fallback: обычная перезагрузка
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isPermissionError) {
        return (
          <div className="p-6 max-w-md mx-auto">
            <Alert variant="destructive">
              <ShieldX className="h-4 w-4" />
              <AlertTitle>Недостаточно прав доступа</AlertTitle>
              <AlertDescription>
                У вас нет прав для выполнения этой операции. Обратитесь к администратору.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.href = '/profile'}
              className="mt-4 w-full"
              variant="outline"
            >
              Вернуться в профиль
            </Button>
          </div>
        );
      }

      if (this.state.isChunkLoadError || this.state.isModuleLoadError) {
        return (
          <div className="p-6 max-w-md mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Ошибка загрузки административного модуля</AlertTitle>
              <AlertDescription>
                Не удалось загрузить компонент администратора. Это может быть связано с обновлением приложения или проблемами сети.
                <div className="mt-2 text-xs text-gray-600">
                  Автоматическое восстановление будет выполнено через несколько секунд...
                </div>
              </AlertDescription>
            </Alert>
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Повторить
              </Button>
              <Button 
                onClick={this.handleReload}
                className="flex-1"
              >
                Перезагрузить
              </Button>
            </div>
          </div>
        );
      }

      return (
        <div className="p-6 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ошибка в административной панели</AlertTitle>
            <AlertDescription>
              Произошла ошибка при выполнении административной операции.
              {this.state.error && (
                <details className="mt-2 text-xs">
                  <summary className="cursor-pointer">Техническая информация</summary>
                  <pre className="mt-1 whitespace-pre-wrap break-words">
                    {this.state.error.message}
                    {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                      `\n\nStack:\n${this.state.error.stack}`
                    )}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 mt-4">
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              className="flex-1"
            >
              Повторить
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin'}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              В админку
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
