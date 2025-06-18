
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
    <div className={`space-y-4 ${isMobile ? 'pb-24' : ''}`}>
      {/* Success Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className={`${isMobile ? 'p-4' : 'pt-6'}`}>
          <div className={`flex items-center ${isMobile ? 'flex-col text-center space-y-3' : 'justify-center space-x-4'}`}>
            <div className={`flex items-center justify-center ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-blue-100 rounded-full`}>
              <CheckCircle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600`} />
            </div>
            <div className={isMobile ? 'text-center' : ''}>
              <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-800 mb-2`}>
                Предварительный просмотр товара
              </h1>
              <p className={`text-blue-700 ${isMobile ? 'text-sm' : ''}`}>
                Проверьте все данные перед публикацией
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details */}
      <div className="space-y-4">
        {/* Basic Information */}
        <MobileFormSection 
          title="Информация о товаре" 
          icon={<Package className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Наименование</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{productData.title}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Бренд</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{getBrandDisplay()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Модель</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{getModelDisplay()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Статус</div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Готов к публикации
              </Badge>
            </div>
          </div>
        </MobileFormSection>

        {/* Financial Information */}
        <MobileFormSection 
          title="Финансовая информация" 
          icon={<DollarSign className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Цена товара</div>
              <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>${formatPrice(productData.price)}</div>
            </div>
            {productData.deliveryPrice && parseFloat(productData.deliveryPrice) > 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Стоимость доставки</div>
                <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold`}>${formatPrice(productData.deliveryPrice)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Количество мест</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{productData.placeNumber || 1}</div>
            </div>
          </div>
        </MobileFormSection>

        {/* Seller Information */}
        <MobileFormSection 
          title="Информация о продавце" 
          icon={<User className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div>
            <div className={`bg-blue-50 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
              <div className="text-xs text-muted-foreground mb-1">Продавец</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{productData.sellerName || 'Не указан'}</div>
            </div>
          </div>
        </MobileFormSection>

        {/* Additional Information */}
        <MobileFormSection 
          title="Дополнительная информация"
          defaultOpen={true}
        >
          <div>
            {productData.description ? (
              <div className={`bg-muted/30 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
                <p className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : ''}`}>{productData.description}</p>
              </div>
            ) : (
              <div className={`text-xs text-muted-foreground italic ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Описание не указано
              </div>
            )}
          </div>
        </MobileFormSection>
      </div>

      {/* Media Section */}
      {(productData.imageUrls.length > 0 || productData.videoUrls.length > 0) && (
        <MobileFormSection 
          title={`Медиафайлы товара (${productData.imageUrls.length + productData.videoUrls.length})`}
          icon={<Camera className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            {productData.imageUrls.length > 0 && (
              <div>
                <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium mb-3`}>Изображения ({productData.imageUrls.length})</h3>
                <OptimizedOrderImages images={productData.imageUrls} />
              </div>
            )}

            {productData.videoUrls.length > 0 && (
              <div>
                <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium mb-3`}>Видео ({productData.videoUrls.length})</h3>
                <OptimizedOrderVideos videos={productData.videoUrls} />
              </div>
            )}
          </div>
        </MobileFormSection>
      )}
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button variant="outline" onClick={onClose} disabled={isSubmitting} className={`${isMobile ? 'h-12 text-sm' : 'h-11'}`}>
        Редактировать
      </Button>
      <Button onClick={onConfirm} disabled={isSubmitting} className={`${isMobile ? 'h-12 text-sm' : 'h-11'} bg-green-600 hover:bg-green-700`}>
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
        <SheetContent side="bottom" className="h-[95vh] w-full flex flex-col p-4">
          <SheetHeader className="text-left pb-2">
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
          <ScrollArea className="flex-grow my-2">
            <PreviewContent />
          </ScrollArea>
          {/* Actions - фиксированные внизу для мобильного */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Предпросмотр товара</DialogTitle>
          <DialogDescription>
            Проверьте данные перед публикацией товара
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-2">
          <PreviewContent />
        </div>
        <DialogFooter className="flex justify-between gap-3 mt-6">
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPreviewDialog;
