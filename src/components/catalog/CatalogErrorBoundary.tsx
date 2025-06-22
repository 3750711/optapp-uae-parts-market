
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  isHelmetError: boolean;
}

class CatalogErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    isHelmetError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Проверяем, является ли ошибка связанной с Helmet
    const isHelmetError = error.message?.includes('helmet') || 
                         error.message?.includes('HelmetProvider') ||
                         error.message?.includes('helmetInstances');
    
    return { 
      hasError: true, 
      error,
      isHelmetError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Catalog error boundary caught an error:', error, errorInfo);
    
    // Специальная обработка для ошибок Helmet
    if (this.state.isHelmetError) {
      console.warn('Helmet error detected, trying to recover...');
      
      // Попытка восстановления через переустановку meta тегов
      setTimeout(() => {
        try {
          document.title = "Каталог товаров - PartsBay.ae";
          
          let meta = document.querySelector('meta[name="description"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'description');
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', 'Browse our wide selection of products.');
          
          // Сбрасываем состояние ошибки после попытки восстановления
          this.setState({ hasError: false, error: undefined, isHelmetError: false });
        } catch (recoveryError) {
          console.error('Failed to recover from Helmet error:', recoveryError);
        }
      }, 100);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">
                  {this.state.isHelmetError 
                    ? 'Ошибка SEO компонентов' 
                    : 'Ошибка загрузки каталога'
                  }
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  {this.state.isHelmetError
                    ? 'Произошла ошибка с SEO meta-тегами. Страница может работать некорректно.'
                    : 'Произошла ошибка при загрузке страницы каталога.'
                  }
                  {this.state.error && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Подробности</summary>
                      <pre className="text-xs mt-1 p-2 bg-gray-100 rounded overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => this.setState({ hasError: false, error: undefined, isHelmetError: false })}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Попробовать снова
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1"
              >
                На главную
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CatalogErrorBoundary;
