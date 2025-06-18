
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
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-blue-800">Предпросмотр заказа</h1>
            <p className="text-xs text-blue-700">Проверьте данные перед созданием</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            Готов
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column - Product & Participants */}
        <div className="space-y-3">
          {/* Product Info */}
          <Card className="border border-gray-200">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Товар</span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{formData.title || 'Не указано'}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Бренд:</span>
                    <div className="font-medium">{formData.brand || 'Не указан'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Модель:</span>
                    <div className="font-medium">{formData.model || 'Не указана'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">${formatPrice(formData.price)}</div>
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
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Участники</span>
              </div>
              
              <div className="space-y-2">
                {/* Seller */}
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-blue-600 font-medium">Продавец</div>
                      <div className="text-sm font-medium">{selectedSeller?.full_name || 'Не указан'}</div>
                    </div>
                    {selectedSeller?.opt_id && (
                      <Badge variant="outline" className="text-xs">
                        {selectedSeller.opt_id}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Buyer */}
                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-green-600 font-medium">Покупатель</div>
                      <div className="text-sm font-medium">{buyerProfile?.full_name || 'Не указан'}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formData.buyerOptId || 'Не указан'}
                    </Badge>
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <div className="flex items-center gap-2">
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
        <div className="space-y-3">
          {/* Optimized Media Section */}
          {(images.length > 0 || videos.length > 0) && (
            <Card className="border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Медиафайлы</span>
                </div>
                
                <CompactMediaGrid 
                  images={images} 
                  videos={videos}
                  maxPreviewItems={isMobile ? 16 : 20}
                />
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          {formData.text_order && (
            <Card className="border border-gray-200">
              <CardContent className="p-3">
                <div className="text-sm font-medium mb-2">Дополнительная информация</div>
                <div className="bg-gray-50 p-2 rounded text-xs max-h-16 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-gray-700">{formData.text_order}</p>
                </div>
              </CardContent>
            </Card>
          )}
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
        size={isMobile ? "default" : "sm"}
        className={isMobile ? "flex-1" : ""}
      >
        Назад
      </Button>
      <Button 
        onClick={onConfirm} 
        disabled={isLoading} 
        className={`bg-green-600 hover:bg-green-700 ${isMobile ? "flex-1" : ""}`}
        size={isMobile ? "default" : "sm"}
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
        <SheetContent side="bottom" className="flex flex-col p-3 h-[90vh]">
          <SheetHeader className="pb-2 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-base">Предпросмотр заказа</SheetTitle>
                <SheetDescription className="text-xs">
                  Проверьте данные перед созданием
                </SheetDescription>
              </div>
              <SheetClose asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1">
            <PreviewContent />
          </ScrollArea>
          
          <div className="border-t bg-white p-3 flex gap-2 flex-shrink-0">
            <ActionButtons />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg">Предпросмотр заказа</DialogTitle>
          <DialogDescription className="text-sm">
            Проверьте все данные перед созданием заказа
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-2">
          <PreviewContent />
        </ScrollArea>
        
        <Separator className="my-3" />
        
        <DialogFooter className="flex-shrink-0">
          <div className="flex gap-2 w-full justify-end">
            <ActionButtons />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
