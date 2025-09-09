import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Enhanced error boundary for module loading failures
 * Specifically handles issues with inline modules blocked on mobile networks
 */
export class ModuleLoadingBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🚨 Module loading boundary caught error:', error);
    
    // Check if this is a module loading issue
    const isModuleError = 
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.message.includes('data:') ||
      error.message.includes('getSession-timeout') ||
      error.name === 'ChunkLoadError';
      
    if (isModuleError) {
      console.warn('💡 This appears to be a module loading issue (possibly network blocking)');
      console.info('🔄 Try refreshing the page or checking network connection');
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('📦 Module loading error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    console.info('🔄 Reloading page to recover from module error...');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card rounded-lg p-6 border shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">
                Ошибка загрузки приложения
              </h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Не удалось загрузить основные модули приложения. 
                Это может быть связано с временными проблемами сети.
              </p>
              
              {this.state.error?.message?.includes('data:') && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-xs text-muted-foreground">
                    💡 Обнаружена проблема с inline-модулями. 
                    Попробуйте обновить страницу или проверьте интернет-соединение.
                  </p>
                </div>
              )}
              
              <Button 
                onClick={this.handleReload} 
                className="w-full gap-2"
                variant="default"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить страницу
              </Button>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground mb-2">
                    Техническая информация
                  </summary>
                  <pre className="bg-muted/50 p-2 rounded text-xs overflow-auto">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}