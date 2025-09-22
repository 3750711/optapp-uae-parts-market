import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

export const TrustedSellerIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
      <Shield className="h-5 w-5 text-primary" />
      <div>
        <Badge variant="default" className="bg-primary text-primary-foreground">
          Доверенный продавец
        </Badge>
        <p className="text-sm text-muted-foreground mt-1">
          Ваши товары публикуются автоматически без модерации
        </p>
      </div>
    </div>
  );
};