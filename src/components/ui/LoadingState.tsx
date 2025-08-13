
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BrandedLoader from '@/components/loading/BrandedLoader';
interface LoadingStateProps {
  isLoading?: boolean;
  error?: Error | string | null;
  children: React.ReactNode;
  onRetry?: () => void;
  loadingText?: string;
  errorText?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading = false,
  error = null,
  children,
  onRetry,
  loadingText = "Загрузка...",
  errorText = "Произошла ошибка",
  className = "",
}) => {
  if (isLoading) {
    return <BrandedLoader variant="section" />;
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    return (
      <div className={`p-4 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{errorText}: {errorMessage}</span>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Повторить
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
};
