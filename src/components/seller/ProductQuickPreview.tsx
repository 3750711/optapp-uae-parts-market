
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { X } from "lucide-react";

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  status: string;
  product_images?: { url: string; is_primary?: boolean }[];
  delivery_price?: number;
  lot_number: number;
  description?: string;
}

interface ProductQuickPreviewProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectProduct: (product: Product) => void;
}

const ProductQuickPreview = React.memo(({ 
  product, 
  open, 
  onOpenChange, 
  onSelectProduct 
}: ProductQuickPreviewProps) => {
  if (!product) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

  const handleSelectProduct = () => {
    onSelectProduct(product);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold pr-8">
            Предварительный просмотр товара
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Изображение товара */}
          <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
            {primaryImage ? (
              <OptimizedImage
                src={primaryImage.url}
                alt={product.title}
                className="w-full h-full object-cover"
                placeholder={true}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>Нет фото</span>
              </div>
            )}
          </div>

          {/* Основная информация */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">
                Лот: {product.lot_number}
              </Badge>
              <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                {product.status}
              </Badge>
            </div>

            <h3 className="text-xl font-semibold">{product.title}</h3>

            {(product.brand || product.model) && (
              <p className="text-gray-600">
                {[product.brand, product.model].filter(Boolean).join(' ')}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                ${formatPrice(product.price)}
              </span>
              {product.delivery_price && (
                <span className="text-sm text-gray-500">
                  Доставка: ${formatPrice(product.delivery_price)}
                </span>
              )}
            </div>

            {product.description && (
              <div className="space-y-2">
                <h4 className="font-medium">Описание:</h4>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleSelectProduct}
              className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Выбрать этот товар
            </button>
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ProductQuickPreview.displayName = "ProductQuickPreview";

export default ProductQuickPreview;
