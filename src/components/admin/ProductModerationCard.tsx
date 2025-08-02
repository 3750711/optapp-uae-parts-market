import React, { useState } from 'react';
import { InlineEditableField } from '@/components/ui/InlineEditableField';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Eye, Package } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  delivery_price?: number;
  place_number?: number;
  status: string;
  product_images?: Array<{ url: string; is_primary?: boolean }>;
  seller_name: string;
  brand?: string;
  model?: string;
}

interface ProductModerationCardProps {
  product: Product;
  onUpdate: () => void;
}

const ProductModerationCard: React.FC<ProductModerationCardProps> = ({
  product,
  onUpdate
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  const handleFieldUpdate = async (field: string, value: string | number) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ [field]: value })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Товар успешно обновлен",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить товар",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'active' })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Товар опубликован",
        description: "Товар успешно опубликован",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error publishing product:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось опубликовать товар",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'created':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage.url}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge 
          className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}
          variant="outline"
        >
          {product.status}
        </Badge>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Title */}
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Название
          </label>
          <InlineEditableField
            value={product.title}
            onSave={(value) => handleFieldUpdate('title', value)}
            placeholder="Название товара"
            className="mt-1"
            displayClassName="text-sm font-medium"
          />
        </div>

        {/* Price and Details */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Цена
            </label>
            <InlineEditableField
              value={product.price}
              onSave={(value) => handleFieldUpdate('price', value)}
              type="number"
              placeholder="0"
              prefix="$"
              className="mt-1"
              displayClassName="text-sm font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Места
            </label>
            <InlineEditableField
              value={product.place_number || 1}
              onSave={(value) => handleFieldUpdate('place_number', value)}
              type="number"
              placeholder="1"
              min={1}
              className="mt-1"
              displayClassName="text-sm font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Доставка
            </label>
            <InlineEditableField
              value={product.delivery_price || 0}
              onSave={(value) => handleFieldUpdate('delivery_price', value)}
              type="number"
              placeholder="0"
              prefix="$"
              className="mt-1"
              displayClassName="text-sm font-medium"
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Продавец: {product.seller_name}</div>
          {product.brand && <div>Бренд: {product.brand}</div>}
          {product.model && <div>Модель: {product.model}</div>}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(`/product/${product.id}`, '_blank')}
          >
            <Eye className="h-4 w-4 mr-1" />
            Предпросмотр
          </Button>
          
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            size="sm"
            className="flex-1"
          >
            {isPublishing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            Опубликовать
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductModerationCard;