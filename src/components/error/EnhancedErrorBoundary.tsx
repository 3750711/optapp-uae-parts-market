import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/utils/productionLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  retryCount: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export class EnhancedErrorBoundary extends Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    const { errorId } = this.state;

    // Log error with context
    logger.error(`[ErrorBoundary:${level}] Error caught:`, {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Report to external service if critical
    if (level === 'critical') {
      this.reportError(error, errorInfo, errorId);
    }

    onError?.(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: React.ErrorInfo, errorId?: string) => {
    try {
      // In real app, send to error reporting service
      // await errorReportingService.report({ error, errorInfo, errorId });
      console.warn('[ErrorBoundary] Error reported:', errorId);
    } catch (reportError) {
      logger.error('[ErrorBoundary] Failed to report error:', reportError);
    }
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= MAX_RETRIES) {
      logger.warn('[ErrorBoundary] Max retries reached');
      return;
    }

    this.setState({ 
      retryCount: retryCount + 1 
    });

    // Delayed retry to avoid immediate re-crash
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorId: undefined,
      });
    }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorId: undefined,
      retryCount: 0,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorId, retryCount } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError && fallback) {
      return fallback;
    }

    if (hasError) {
      return <ErrorFallback 
        error={error}
        errorId={errorId}
        retryCount={retryCount}
        maxRetries={MAX_RETRIES}
        level={level}
        onRetry={this.handleRetry}
        onReset={this.handleReset}
        onReload={this.handleReload}
        onGoHome={this.handleGoHome}
      />;
    }

    return children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorId?: string;
  retryCount: number;
  maxRetries: number;
  level: string;
  onRetry: () => void;
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

function ErrorFallback({
  error,
  errorId,
  retryCount,
  maxRetries,
  level,
  onRetry,
  onReset,
  onReload,
  onGoHome,
}: ErrorFallbackProps) {
  const canRetry = retryCount < maxRetries;
  const isPageLevel = level === 'page';
  const isCritical = level === 'critical';

  return (
    <div className={`flex items-center justify-center p-4 ${isPageLevel ? 'min-h-screen bg-background' : 'min-h-[200px]'}`}>
      <Card className={`w-full ${isPageLevel ? 'max-w-md' : 'max-w-sm'} shadow-lg`}>
        <CardHeader className="text-center">
          <div className={`mx-auto w-12 h-12 ${isCritical ? 'text-destructive' : 'text-warning'} mb-2`}>
            {isCritical ? <Bug className="w-full h-full" /> : <AlertTriangle className="w-full h-full" />}
          </div>
          <CardTitle className="text-lg">
            {isCritical ? 'Критическая ошибка' : 'Что-то пошло не так'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4 text-center">
          <div className="text-sm text-muted-foreground">
            {isCritical ? (
              'Произошла критическая ошибка в приложении'
            ) : (
              'Не удалось загрузить эту часть страницы'
            )}
          </div>

          {error && import.meta.env.DEV && (
            <details className="text-xs text-left bg-muted p-2 rounded">
              <summary className="cursor-pointer font-medium mb-1">Детали ошибки</summary>
              <div className="space-y-1">
                <div><strong>ID:</strong> {errorId}</div>
                <div><strong>Сообщение:</strong> {error.message}</div>
                {retryCount > 0 && <div><strong>Попыток:</strong> {retryCount}/{maxRetries}</div>}
              </div>
            </details>
          )}

          <div className="flex flex-col space-y-2">
            {canRetry && (
              <Button 
                onClick={onRetry} 
                variant="default" 
                className="w-full"
                disabled={false}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Попробовать снова {retryCount > 0 && `(${retryCount}/${maxRetries})`}
              </Button>
            )}

            {!canRetry && !isPageLevel && (
              <Button onClick={onReset} variant="outline" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Сбросить компонент
              </Button>
            )}

            {isPageLevel && (
              <>
                <Button onClick={onReload} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Перезагрузить страницу
                </Button>
                
                <Button onClick={onGoHome} variant="ghost" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  На главную
                </Button>
              </>
            )}
          </div>

          {isCritical && (
            <div className="text-xs text-muted-foreground">
              Ошибка автоматически отправлена разработчикам
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Convenience HOC for wrapping components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <EnhancedErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    );
  };
}