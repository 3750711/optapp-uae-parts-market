
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import BrandedLoader from '@/components/loading/BrandedLoader';
export const ComponentFallback: React.FC<{ componentName: string }> = ({ componentName }) => (
  <Card className="border-dashed border-2 border-muted">
    <CardContent className="flex items-center justify-center p-8">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Компонент {componentName} недоступен
        </p>
      </div>
    </CardContent>
  </Card>
);

export const LoadingSkeleton: React.FC = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    </CardContent>
  </Card>
);

export const EmptyState: React.FC<{ message: string; description?: string }> = ({ 
  message, 
  description 
}) => (
  <Card className="border-dashed border-2 border-muted">
    <CardContent className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="text-muted-foreground text-lg mb-2">{message}</div>
        {description && (
          <div className="text-muted-foreground text-sm">{description}</div>
        )}
      </div>
    </CardContent>
  </Card>
);

export const LoadingIndicator: React.FC<{ message?: string }> = () => (
  <BrandedLoader variant="section" />
);
