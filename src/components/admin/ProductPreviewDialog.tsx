
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
import { Loader2, Truck, Users, X, Package, DollarSign, User, Camera, CheckCircle, Play, Image as ImageIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { normalizeDecimal, formatPrice } from '@/utils/number';

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
  
  const formatPriceDisplay = (price?: string) => {
    if (!price) return '0';
    const num = normalizeDecimal(price);
    return num.toLocaleString('ru-RU');
  };

  const getBrandDisplay = () => {
    if (!productData.brandName || productData.brandName.trim() === '') return 'Не указан';
    return productData.brandName;
  };

  const getModelDisplay = () => {
    if (!productData.modelName || productData.modelName.trim() === '') return 'Не указана';
    return productData.modelName;
  };

  const MediaThumbnail = ({ url, type }: { url: string; type: 'image' | 'video' }) => (
    <div className="relative w-16 h-16 rounded border overflow-hidden bg-gray-100 flex-shrink-0">
      {type === 'image' ? (
        <>
          <img
            src={url}
            alt="Изображение товара"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 left-1 bg-blue-500 text-white rounded px-1 text-xs">
            <ImageIcon className="w-2 h-2" />
          </div>
        </>
      ) : (
        <>
          <video
            src={url}
            className="w-full h-full object-cover"
            preload="metadata"
            muted
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <Play className="w-4 h-4 text-white" />
          </div>
          <div className="absolute top-1 left-1 bg-red-500 text-white rounded px-1 text-xs">
            <Camera className="w-2 h-2" />
          </div>
        </>
      )}
    </div>
  );

  const PreviewContent = () => (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
            <CheckCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-blue-800 leading-tight">
              Предварительный просмотр товара
            </h1>
            <p className="text-xs text-blue-700 mt-1">
              Проверьте все данные перед публикацией
            </p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-1 whitespace-nowrap">
            Готов к публикации
          </Badge>
        </div>
      </div>

      {/* Compact Product Information */}
      <Card className="border border-gray-200">
        <CardContent className="p-3 space-y-3">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Товар</span>
            </div>
            <div className="text-base font-semibold text-gray-900 leading-tight">
              {productData.title}
            </div>
          </div>

          <Separator className="my-2" />

          {/* Brand & Model in one line */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Бренд:</span>
              <div className="font-medium">{getBrandDisplay()}</div>
            </div>
            <div>
              <span className="text-gray-500">Модель:</span>
              <div className="font-medium">{getModelDisplay()}</div>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Financial info in grid */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">${formatPriceDisplay(productData.price)}</div>
              <div className="text-xs text-gray-500">Цена</div>
            </div>
            {productData.deliveryPrice && normalizeDecimal(productData.deliveryPrice) > 0 && (
              <div className="text-center">
                <div className="text-sm font-semibold">${formatPriceDisplay(productData.deliveryPrice)}</div>
                <div className="text-xs text-gray-500">Доставка</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-sm font-medium">{productData.placeNumber || 1}</div>
              <div className="text-xs text-gray-500">Мест</div>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Seller info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Продавец</span>
            </div>
            <div className="bg-blue-50 px-3 py-2 rounded text-sm font-medium">
              {productData.sellerName || 'Не указан'}
            </div>
          </div>

          {/* Description if exists */}
          {productData.description && (
            <>
              <Separator className="my-2" />
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Описание</div>
                <div className="bg-gray-50 p-2 rounded text-sm max-h-16 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-gray-700">{productData.description}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Optimized Media Section */}
      {(productData.imageUrls.length > 0 || productData.videoUrls.length > 0) && (
        <Card className="border border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Медиафайлы</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {productData.imageUrls.length + productData.videoUrls.length} файлов
              </Badge>
            </div>
            
            <div className="space-y-3">
              {/* Images Section */}
              {productData.imageUrls.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    Изображения ({productData.imageUrls.length})
                    {productData.primaryImage && (
                      <span className="text-blue-600">• Главное фото выбрано</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {productData.imageUrls.slice(0, 6).map((url, index) => (
                      <MediaThumbnail key={`image-${index}`} url={url} type="image" />
                    ))}
                    {productData.imageUrls.length > 6 && (
                      <div className="w-16 h-16 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        +{productData.imageUrls.length - 6}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {productData.videoUrls.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    Видео ({productData.videoUrls.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {productData.videoUrls.slice(0, 4).map((url, index) => (
                      <MediaThumbnail key={`video-${index}`} url={url} type="video" />
                    ))}
                    {productData.videoUrls.length > 4 && (
                      <div className="w-16 h-16 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                        +{productData.videoUrls.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Media Summary */}
            <div className="mt-3 pt-2 border-t text-xs text-gray-500">
              📊 Всего: {productData.imageUrls.length} фото, {productData.videoUrls.length} видео
              {productData.primaryImage && " • Главное фото установлено"}
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
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-3">
          <SheetHeader className="text-left pb-2 flex-shrink-0">
            <SheetTitle className="text-base">Предпросмотр товара</SheetTitle>
            <SheetDescription className="text-xs">
              Проверьте данные перед публикацией
            </SheetDescription>
          </SheetHeader>
          <div className="absolute top-3 right-3">
            <SheetClose asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </SheetClose>
          </div>
          <ScrollArea className="flex-1 -mx-3 px-3">
            <PreviewContent />
          </ScrollArea>
          <div className="flex-shrink-0 pt-3 border-t">
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
      <DialogContent className="max-w-xl max-h-[80vh] flex flex-col p-4">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-base">Предпросмотр товара</DialogTitle>
          <DialogDescription className="text-sm">
            Проверьте данные перед публикацией товара
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-4 px-4 max-h-[55vh]">
          <PreviewContent />
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 flex justify-between gap-3 pt-3 border-t">
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductPreviewDialog;
