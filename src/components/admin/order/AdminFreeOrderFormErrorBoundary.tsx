
import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class AdminFreeOrderFormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('AdminFreeOrderForm Error Boundary:', error);
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('AdminFreeOrderForm Error Details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    
    this.setState({ errorInfo });

    // Отправляем ошибку в систему мониторинга
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: `AdminFreeOrderForm: ${error.message}`,
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/admin/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div>
                    <div className="font-medium">Ошибка в форме создания заказа</div>
                    <div className="text-sm mt-1">
                      {this.state.error?.message || 'Произошла неожиданная ошибка при загрузке формы'}
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={this.handleRetry}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Обновить страницу
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={this.handleGoHome}
                      className="flex items-center gap-2"
                    >
                      <Home className="h-4 w-4" />
                      В админ панель
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-sm bg-gray-50 p-4 rounded border">
                <summary className="cursor-pointer font-medium mb-2">
                  Детали ошибки (только для разработки)
                </summary>
                <pre className="whitespace-pre-wrap text-xs overflow-auto">
                  {this.state.error?.stack}
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

export default AdminFreeOrderFormErrorBoundary;
