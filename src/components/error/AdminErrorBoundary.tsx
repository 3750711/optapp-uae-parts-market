
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldX, AlertTriangle, Settings } from 'lucide-react';
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
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, isPermissionError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isPermissionError = error.message.includes('permission') || 
                             error.message.includes('unauthorized') ||
                             error.message.includes('admin');
    
    return { 
      hasError: true, 
      error,
      isPermissionError 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AdminErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Логируем административные ошибки отдельно
    console.warn('Admin panel error:', {
      error: error.message,
      stack: error.stack,
      component: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, isPermissionError: false });
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

      return (
        <div className="p-6 max-w-md mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ошибка в административной панели</AlertTitle>
            <AlertDescription>
              Произошла ошибка при выполнении административной операции.
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
