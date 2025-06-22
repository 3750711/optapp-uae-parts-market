
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
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      isChunkError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunkError = error.message.includes('loading dynamically imported module') ||
                        error.message.includes('Failed to fetch dynamically imported module') ||
                        error.message.includes('Loading chunk') ||
                        error.name === 'ChunkLoadError';
    
    return { 
      hasError: true, 
      error,
      isChunkError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Route error caught:', error, errorInfo);
    
    // Автоматическое восстановление для chunk ошибок
    if (this.state.isChunkError) {
      setTimeout(() => {
        this.handleChunkError();
      }, 1000);
    }
  }

  handleChunkError = async () => {
    try {
      console.log('🔄 Attempting chunk error recovery...');
      
      // Очищаем кеши
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Перезагружаем страницу
      window.location.reload();
    } catch (error) {
      console.error('Error during chunk recovery:', error);
      window.location.reload();
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isChunkError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Автоматическое восстановление для chunk ошибок
      if (this.state.isChunkError) {
        return (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Обновление модулей...</p>
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
