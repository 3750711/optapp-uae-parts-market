import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary for Seller Products section
 * Allows main product page to function even if seller products fail
 */
class SellerProductsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Seller Products Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Не удалось загрузить товары продавца</AlertTitle>
          <AlertDescription>
            Произошла ошибка при загрузке других товаров этого продавца. Основная информация о товаре доступна выше.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default SellerProductsErrorBoundary;
