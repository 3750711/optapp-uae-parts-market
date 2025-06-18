
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileOrderCreationHeaderProps {
  title: string;
  description: string;
  isDraft?: boolean;
}

export const MobileOrderCreationHeader: React.FC<MobileOrderCreationHeaderProps> = ({
  title,
  description,
  isDraft = false
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{title}</h1>
          {isDraft && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Черновик
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{title}</h1>
          {isDraft && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
              Черновик
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
