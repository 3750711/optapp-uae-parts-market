import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Package, Tag, User } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface ProductInfoProps {
  brand: string;
  model: string;
  year?: string | number;
  condition?: string;
  status?: string;
  sellerName?: string;
  createdAt?: string;
  deliveryMethod?: string;
}

const ProductInfo: React.FC<ProductInfoProps> = ({
  brand,
  model,
  year,
  condition,
  status,
  sellerName,
  createdAt,
  deliveryMethod,
}) => {
  const { user } = useAuth();

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            {brand} {model}
          </Badge>
          {year && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {year}
            </Badge>
          )}
          {condition && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              {condition}
            </Badge>
          )}
          {status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {status}
            </Badge>
          )}
        </div>
        <Separator />
        <div className="text-sm text-muted-foreground">
          {sellerName && (
            <div>
              Продавец: <span className="font-medium">{sellerName}</span>
            </div>
          )}
          {createdAt && (
            <div>
              Добавлено: <span className="font-medium">{new Date(createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
          )}
          {deliveryMethod && (
            <div>
              Способ доставки: <span className="font-medium">{deliveryMethod}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductInfo;
