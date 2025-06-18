
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Truck, Users, X, Package, DollarSign, User, Camera, CheckCircle } from 'lucide-react';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFormSection } from '@/components/admin/order/MobileFormSection';

interface ProductData {
  title: string;
  price: string;
  description?: string;
  brandName?: string;
  modelName?: string;
  sellerName?: string;
  imageUrls: string[];
  videoUrls: string[];
  placeNumber?: string;
  deliveryPrice?: string;
  primaryImage?: string;
}

interface ProductPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productData: ProductData | null;
  isSubmitting: boolean;
}

const ProductPreviewDialog: React.FC<ProductPreviewDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  productData,
  isSubmitting,
}) => {
  const isMobile = useIsMobile();

  if (!isOpen || !productData) {
    return null;
  }
  
  const formatPrice = (price?: string) => {
    if (!price || isNaN(parseFloat(price))) return '0';
    return parseFloat(price).toLocaleString('ru-RU');
  };

  const getBrandDisplay = () => {
    if (!productData.brandName || productData.brandName.trim() === '') return 'Не указан';
    return productData.brandName;
  };

  const getModelDisplay = () => {
    if (!productData.modelName || productData.modelName.trim() === '') return 'Не указана';
    return productData.modelName;
  };

  const PreviewContent = () => (
    <div className="space-y-4">
      {/* Compact Success Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-blue-800">
                Предварительный просмотр товара
              </h1>
              <p className="text-sm text-blue-700">
                Проверьте все данные перед публикацией
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Product Details */}
      <div className="grid gap-3">
        {/* Basic Information - Compact */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Информация о товаре</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 gap-1">
                <div>
                  <span className="text-xs text-muted-foreground">Наименование:</span>
                  <span className="ml-2 font-medium">{productData.title}</span>
                </div>
                <div className="flex gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Бренд:</span>
                    <span className="ml-2">{getBrandDisplay()}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Модель:</span>
                    <span className="ml-2">{getModelDisplay()}</span>
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs">
                    Готов к публикации
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information - Compact */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Финансовая информация</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-green-600">${formatPrice(productData.price)}</div>
                <div className="text-xs text-muted-foreground">Цена товара</div>
              </div>
              {productData.deliveryPrice && parseFloat(productData.deliveryPrice) > 0 && (
                <div className="text-right">
                  <div className="text-sm font-semibold">${formatPrice(productData.deliveryPrice)}</div>
                  <div className="text-xs text-muted-foreground">Доставка</div>
                </div>
              )}
              <div className="text-right">
                <div className="text-sm font-medium">{productData.placeNumber || 1}</div>
                <div className="text-xs text-muted-foreground">Мест</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller Information - Compact */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Продавец</h3>
            </div>
            <div className="bg-blue-50 p-2 rounded text-sm">
              <span className="font-medium">{productData.sellerName || 'Не указан'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Description - Compact if exists */}
        {productData.description && (
          <Card>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm mb-2">Описание</h3>
              <div className="bg-muted/30 p-2 rounded text-sm max-h-20 overflow-y-auto">
                <p className="whitespace-pre-wrap">{productData.description}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Media Section - Compact */}
      {(productData.imageUrls.length > 0 || productData.videoUrls.length > 0) && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">
                Медиафайлы ({productData.imageUrls.length + productData.videoUrls.length})
              </h3>
            </div>
            <div className="space-y-3">
              {productData.imageUrls.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Изображения ({productData.imageUrls.length})
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    <OptimizedOrderImages images={productData.imageUrls} />
                  </div>
                </div>
              )}

              {productData.videoUrls.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Видео ({productData.videoUrls.length})
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    <OptimizedOrderVideos videos={productData.videoUrls} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="h-10">
        Редактировать
      </Button>
      <Button onClick={onConfirm} disabled={isSubmitting} className="h-10 bg-green-600 hover:bg-green-700">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Публикация...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Опубликовать товар
          </>
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-4">
          <SheetHeader className="text-left pb-2 flex-shrink-0">
            <SheetTitle className="text-lg">Предпросмотр товара</SheetTitle>
            <SheetDescription className="text-sm">
              Проверьте данные перед публикацией
            </SheetDescription>
          </SheetHeader>
          <div className="absolute top-4 right-4">
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <ScrollArea className="flex-1 -mx-4 px-4">
            <PreviewContent />
          </ScrollArea>
          <div className="flex-shrink-0 pt-4 border-t">
            <div className="grid grid-cols-2 gap-3">
              <ActionButtons />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-lg">Предпросмотр товара</DialogTitle>
          <DialogDescription className="text-sm">
            Проверьте данные перед публикацией товара
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-4 px-4 max-h-[60vh]">
          <PreviewContent />
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 flex justify-between gap-3 pt-4 border-t">
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPreviewDialog;
