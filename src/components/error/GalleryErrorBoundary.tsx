import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageOff, RefreshCw } from 'lucide-react';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary specifically for Product Gallery
 * Prevents entire page crash if gallery fails to load
 */
class GalleryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Gallery Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <ImageOff className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Ошибка загрузки галереи
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                К сожалению, не удалось загрузить изображения. Попробуйте обновить страницу.
              </p>
            </div>
            <Button onClick={this.handleRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить страницу
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default GalleryErrorBoundary;
