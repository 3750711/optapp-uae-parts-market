
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
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-blue-800">Предпросмотр заказа</h1>
            <p className="text-sm text-blue-700">Проверьте данные перед созданием</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Готов
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column - Product & Financial Info */}
        <div className="space-y-4">
          {/* Product Info */}
          <Card className="border border-gray-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Товар</span>
              </div>
              
              <div className="space-y-3">
                <div className="text-lg font-semibold text-gray-900">
                  {formData.title || 'Не указано'}
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Бренд:</span>
                    <div className="font-medium mt-1">{formData.brand || 'Не указан'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Модель:</span>
                    <div className="font-medium mt-1">{formData.model || 'Не указана'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${formatPrice(formData.price)}</div>
                    <div className="text-xs text-gray-500">Цена</div>
                  </div>
                  {formData.delivery_price && parseFloat(formData.delivery_price) > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-orange-600">${formatPrice(formData.delivery_price)}</div>
                      <div className="text-xs text-gray-500">Доставка</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-medium">{formData.place_number || 1}</div>
                    <div className="text-xs text-gray-500">Мест</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card className="border border-gray-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-5 w-5 text-gray-500" />
                <span className="font-medium">Участники</span>
              </div>
              
              <div className="space-y-3">
                {/* Seller */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-blue-600 font-medium mb-1">Продавец</div>
                      <div className="font-medium">{selectedSeller?.full_name || 'Не указан'}</div>
                    </div>
                    {selectedSeller?.opt_id && (
                      <Badge variant="outline" className="ml-2">
                        {selectedSeller.opt_id}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Buyer */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-green-600 font-medium mb-1">Покупатель</div>
                      <div className="font-medium">{buyerProfile?.full_name || 'Не указан'}</div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {formData.buyerOptId || 'Не указан'}
                    </Badge>
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">
                      {getDeliveryMethodLabel(formData.deliveryMethod)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Media & Additional Info */}
        <div className="space-y-4">
          {/* Enhanced Media Section */}
          {(images.length > 0 || videos.length > 0) && (
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="h-5 w-5 text-gray-500" />
                  <span className="font-medium">Медиафайлы ({images.length + videos.length})</span>
                  <Badge variant="outline" className="ml-auto">
                    📸 {images.length} • 🎥 {videos.length}
                  </Badge>
                </div>
                
                <CompactMediaGrid 
                  images={images} 
                  videos={videos}
                  maxPreviewItems={isMobile ? 20 : 30}
                />
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          {formData.text_order && (
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <div className="font-medium mb-3">Дополнительная информация</div>
                <div className="bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{formData.text_order}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Stats */}
          <Card className="border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
            <CardContent className="p-4">
              <div className="font-medium mb-3">Сводка заказа</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
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
        className={isMobile ? "flex-1" : ""}
      >
        Назад
      </Button>
      <Button 
        onClick={onConfirm} 
        disabled={isLoading} 
        className={`bg-green-600 hover:bg-green-700 ${isMobile ? "flex-1" : ""}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Создание...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Создать заказ
          </>
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="flex flex-col h-[90vh] max-h-[90vh]">
          <SheetHeader className="pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle>Предпросмотр заказа</SheetTitle>
                <SheetDescription>
                  Проверьте данные перед созданием
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button size="icon" variant="ghost">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1 px-4">
            <div className="pb-4">
              <PreviewContent />
            </div>
          </ScrollArea>
          
          <div className="border-t bg-white p-4 flex gap-3 flex-shrink-0">
            <ActionButtons />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle>Предпросмотр заказа</DialogTitle>
          <DialogDescription>
            Проверьте все данные перед созданием заказа
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="pb-4">
            <PreviewContent />
          </div>
        </ScrollArea>
        
        <Separator className="my-4" />
        
        <DialogFooter className="flex-shrink-0">
          <div className="flex gap-3 w-full justify-end">
            <ActionButtons />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
