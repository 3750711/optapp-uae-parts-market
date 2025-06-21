
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, CheckCircle, Package, User, Camera, X, Truck, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CompactMediaGrid } from '@/components/media/CompactMediaGrid';

interface OrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  images: string[];
  videos: string[];
  selectedSeller: any;
  buyerProfile: any;
  onConfirm: (e: React.FormEvent) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const OrderPreviewDialog: React.FC<OrderPreviewDialogProps> = ({
  open,
  onOpenChange,
  formData,
  images,
  videos,
  selectedSeller,
  buyerProfile,
  onConfirm,
  onBack,
  isLoading
}) => {
  const isMobile = useIsMobile();

  const formatPrice = (price?: string) => {
    if (!price || isNaN(parseFloat(price))) return '0';
    return parseFloat(price).toLocaleString('ru-RU');
  };

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup':
        return 'Самовывоз';
      case 'cargo_rf':
        return 'Cargo РФ';
      case 'cargo_kz':
        return 'Cargo КЗ';
      default:
        return method || 'Не указан';
    }
  };

  const PreviewContent = () => (
    <div className="space-y-2">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-blue-800">Предпросмотр заказа</h1>
            <p className="text-xs text-blue-700">Проверьте данные перед созданием</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            Готов
          </Badge>
        </div>
      </div>

      {/* Compact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Left Column - Product & Financial Info */}
        <div className="space-y-2">
          {/* Product Info */}
          <Card className="border border-gray-200">
            <CardContent className="p-2 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium">Товар</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {formData.title || 'Не указано'}
                </div>
                
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div>
                    <span className="text-gray-500">Бренд:</span>
                    <div className="font-medium truncate">{formData.brand || 'Не указан'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Модель:</span>
                    <div className="font-medium truncate">{formData.model || 'Не указана'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <div className="text-center">
                    <div className="text-base font-bold text-green-600">${formatPrice(formData.price)}</div>
                    <div className="text-xs text-gray-500">Цена</div>
                  </div>
                  {formData.delivery_price && parseFloat(formData.delivery_price) > 0 && (
                    <div className="text-center">
                      <div className="text-sm font-semibold text-orange-600">${formatPrice(formData.delivery_price)}</div>
                      <div className="text-xs text-gray-500">Доставка</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-sm font-medium">{formData.place_number || 1}</div>
                    <div className="text-xs text-gray-500">Мест</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="border border-gray-200">
            <CardContent className="p-2 space-y-1">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium">Участники</span>
              </div>
              
              <div className="space-y-1">
                {/* Seller */}
                <div className="bg-blue-50 border border-blue-200 rounded p-1">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-blue-600 font-medium">Продавец</div>
                      <div className="text-sm font-medium truncate">{selectedSeller?.full_name || 'Не указан'}</div>
                    </div>
                    {selectedSeller?.opt_id && (
                      <Badge variant="outline" className="text-xs ml-1">
                        {selectedSeller.opt_id}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Buyer */}
                <div className="bg-green-50 border border-green-200 rounded p-1">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-green-600 font-medium">Покупатель</div>
                      <div className="text-sm font-medium truncate">{buyerProfile?.full_name || 'Не указан'}</div>
                    </div>
                    <Badge variant="outline" className="text-xs ml-1">
                      {formData.buyerOptId || 'Не указан'}
                    </Badge>
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-1">
                  <div className="flex items-center gap-1">
                    <Truck className="h-3 w-3 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-800">
                      {getDeliveryMethodLabel(formData.deliveryMethod)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Media & Additional Info */}
        <div className="space-y-2">
          {/* Compact Media Section */}
          {(images.length > 0 || videos.length > 0) && (
            <Card className="border border-gray-200">
              <CardContent className="p-2">
                <div className="flex items-center gap-2 mb-2">
                  <Camera className="h-3 w-3 text-gray-500" />
                  <span className="text-xs font-medium">Медиафайлы ({images.length + videos.length})</span>
                </div>
                
                <CompactMediaGrid 
                  images={images} 
                  videos={videos}
                  maxPreviewItems={isMobile ? 12 : 16}
                />
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          {formData.text_order && (
            <Card className="border border-gray-200">
              <CardContent className="p-2">
                <div className="text-xs font-medium mb-1">Дополнительная информация</div>
                <div className="bg-gray-50 p-1 rounded text-xs max-h-12 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-gray-700 leading-tight">{formData.text_order}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <CardContent className="p-2">
              <div className="text-xs font-medium mb-1">Сводка заказа</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Товаров:</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Мест:</span>
                  <span className="font-medium">{formData.place_number || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Фото:</span>
                  <span className="font-medium">{images.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Видео:</span>
                  <span className="font-medium">{videos.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button 
        variant="outline" 
        onClick={onBack} 
        disabled={isLoading}
        size="sm"
        className={isMobile ? "flex-1" : ""}
      >
        Назад
      </Button>
      <Button 
        onClick={onConfirm} 
        disabled={isLoading} 
        className={`bg-green-600 hover:bg-green-700 ${isMobile ? "flex-1" : ""}`}
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Создание...
          </>
        ) : (
          <>
            <CheckCircle className="mr-1 h-3 w-3" />
            Создать заказ
          </>
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex flex-col p-2 h-[90vh]">
          <SheetHeader className="pb-1 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-sm">Предпросмотр заказа</SheetTitle>
                <SheetDescription className="text-xs">
                  Проверьте данные перед созданием
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <X className="h-3 w-3" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <PreviewContent />
          </ScrollArea>
          
          <div className="border-t bg-white p-2 flex gap-2 flex-shrink-0">
            <ActionButtons />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-3">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-base">Предпросмотр заказа</DialogTitle>
          <DialogDescription className="text-sm">
            Проверьте все данные перед созданием заказа
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-1">
          <PreviewContent />
        </ScrollArea>
        
        <Separator className="my-2" />
        
        <DialogFooter className="flex-shrink-0">
          <div className="flex gap-2 w-full justify-end">
            <ActionButtons />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
