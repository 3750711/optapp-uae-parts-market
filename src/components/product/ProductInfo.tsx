import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, Truck, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Product } from '@/types/product';
import { ProductStatusDialog } from '@/components/admin/ProductStatusDialog';

interface ProductInfoProps {
  product: Product;
  onUpdate?: () => void;
}

export const ProductInfo: React.FC<ProductInfoProps> = ({ product, onUpdate }) => {
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает проверки';
      case 'active': return 'Опубликован';
      case 'sold': return 'Продан';
      case 'archived': return 'Архив';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{product.title}</h2>
        {isAdmin && (
          <ProductStatusDialog product={product} trigger={
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Изменить статус
            </Button>
          } onSuccess={onUpdate} />
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Badge variant="secondary">{getStatusLabel(product.status)}</Badge>
        {product.condition && <Badge>{product.condition}</Badge>}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Описание</Label>
        <p className="text-gray-600">{product.description || 'Нет описания'}</p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center"><Package className="h-4 w-4 mr-2" /> Бренд</Label>
          <p className="text-gray-600">{product.brand || 'Не указан'}</p>
        </div>
        <div>
          <Label className="flex items-center"><Truck className="h-4 w-4 mr-2" /> Модель</Label>
          <p className="text-gray-600">{product.model || 'Не указана'}</p>
        </div>
        <div>
          <Label className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> Мест на складе</Label>
          <p className="text-gray-600">{product.place_number || 'Не указано'}</p>
        </div>
        <div>
          <Label className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> Цена доставки</Label>
          <p className="text-gray-600">{product.delivery_price || 'Не указано'}</p>
        </div>
      </div>
    </div>
  );
};
