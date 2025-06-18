import React, { useMemo } from 'react';
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
} from '@/components/ui/sheet';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Loader2, 
  CheckCircle, 
  Package, 
  DollarSign, 
  User, 
  Camera, 
  X,
  Truck,
  MapPin,
  Clock
} from 'lucide-react';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';
import { MobileFormSection } from './MobileFormSection';
import { Badge } from '@/components/ui/badge';

interface EnhancedOrderPreviewDialogProps {
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

export const EnhancedOrderPreviewDialog: React.FC<EnhancedOrderPreviewDialogProps> = ({
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

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup':
        return { label: 'Самовывоз', icon: '📦', color: 'bg-blue-50 text-blue-700' };
      case 'cargo_rf':
        return { label: 'Cargo РФ', icon: '🚛', color: 'bg-green-50 text-green-700' };
      case 'cargo_kz':
        return { label: 'Cargo КЗ', icon: '🚚', color: 'bg-purple-50 text-purple-700' };
      default:
        return { label: method, icon: '📋', color: 'bg-gray-50 text-gray-700' };
    }
  };

  const formatPrice = (price?: string) => {
    if (!price || isNaN(parseFloat(price))) return '0';
    return parseFloat(price).toLocaleString('ru-RU');
  };

  const totalPrice = useMemo(() => {
    const basePrice = parseFloat(formData.price) || 0;
    const deliveryPrice = parseFloat(formData.delivery_price) || 0;
    return basePrice + deliveryPrice;
  }, [formData.price, formData.delivery_price]);

  const deliveryInfo = getDeliveryMethodLabel(formData.deliveryMethod);

  const PreviewContent = () => (
    <div className={`space-y-4 ${isMobile ? 'pb-20' : ''}`}>
      {/* Header with Status */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardContent className={`${isMobile ? 'p-4' : 'pt-6'}`}>
          <div className={`flex items-center ${isMobile ? 'flex-col text-center space-y-3' : 'justify-center space-x-4'}`}>
            <div className={`flex items-center justify-center ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-emerald-100 rounded-full`}>
              <CheckCircle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-emerald-600`} />
            </div>
            <div className={isMobile ? 'text-center' : ''}>
              <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-emerald-800 mb-2`}>
                Готов к созданию
              </h1>
              <p className={`text-emerald-700 ${isMobile ? 'text-sm' : ''}`}>
                Проверьте данные заказа перед подтверждением
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary - Most Important */}
      <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardContent className={`${isMobile ? 'p-4' : 'pt-6'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-amber-600" />
              <div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-amber-800`}>
                  Итого к оплате
                </h3>
                {parseFloat(formData.delivery_price) > 0 && (
                  <p className="text-xs text-amber-700">
                    включая доставку ${formatPrice(formData.delivery_price)}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-amber-900`}>
                ${formatPrice(totalPrice.toString())}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <MobileFormSection 
        title="Информация о заказе" 
        icon={<Package className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Наименование товара</div>
              <div className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} mt-1`}>
                {formData.title || 'Не указано'}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Бренд</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''} mt-1`}>
                  {formData.brand || 'Не указан'}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Модель</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''} mt-1`}>
                  {formData.model || 'Не указана'}
                </div>
              </div>
            </div>

            {formData.place_number && (
              <div className="bg-slate-50 p-3 rounded-lg">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Количество мест</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''} mt-1`}>
                  {formData.place_number}
                </div>
              </div>
            )}
          </div>
        </div>
      </MobileFormSection>

      {/* Delivery Information */}
      {formData.deliveryMethod && (
        <MobileFormSection 
          title="Способ доставки" 
          icon={<Truck className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div className={`${deliveryInfo.color} p-4 rounded-lg`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{deliveryInfo.icon}</span>
              <div>
                <div className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>
                  {deliveryInfo.label}
                </div>
                {parseFloat(formData.delivery_price) > 0 && (
                  <div className="text-xs mt-1">
                    Стоимость доставки: ${formatPrice(formData.delivery_price)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </MobileFormSection>
      )}

      {/* Participants */}
      <MobileFormSection 
        title="Участники сделки" 
        icon={<User className="h-4 w-4" />}
        defaultOpen={true}
      >
        <div className="space-y-3">
          {/* Seller */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                Продавец
              </Badge>
            </div>
            <div className={`font-semibold ${isMobile ? 'text-sm' : ''} text-blue-900`}>
              {selectedSeller?.full_name || 'Не указан'}
            </div>
            {selectedSeller?.opt_id && (
              <div className="text-xs text-blue-700 font-mono mt-1">
                OPT_ID: {selectedSeller.opt_id}
              </div>
            )}
          </div>

          {/* Buyer */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                Покупатель
              </Badge>
            </div>
            <div className={`font-semibold ${isMobile ? 'text-sm' : ''} text-green-900`}>
              {buyerProfile?.full_name || formData.buyerOptId}
            </div>
            <div className="text-xs text-green-700 font-mono mt-1">
              OPT_ID: {formData.buyerOptId}
            </div>
          </div>
        </div>
      </MobileFormSection>

      {/* Additional Information */}
      {formData.text_order && (
        <MobileFormSection 
          title="Дополнительная информация"
          defaultOpen={true}
        >
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : ''}`}>
              {formData.text_order}
            </p>
          </div>
        </MobileFormSection>
      )}

      {/* Media Section */}
      {(images.length > 0 || videos.length > 0) && (
        <MobileFormSection 
          title={`Медиафайлы (${images.length + videos.length})`}
          icon={<Camera className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            {images.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {images.length} изображений
                  </Badge>
                </div>
                <OptimizedOrderImages images={images} />
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {videos.length} видео
                  </Badge>
                </div>
                <OptimizedOrderVideos videos={videos} />
              </div>
            )}
          </div>
        </MobileFormSection>
      )}

      {/* Timestamp */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Создано: {new Date().toLocaleString('ru-RU')}</span>
      </div>
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button 
        variant="outline" 
        onClick={onBack} 
        disabled={isLoading} 
        className={`${isMobile ? 'flex-1' : ''}`}
      >
        Назад к редактированию
      </Button>
      <Button 
        onClick={onConfirm} 
        disabled={isLoading} 
        className={`${isMobile ? 'flex-1' : ''} bg-emerald-600 hover:bg-emerald-700 text-white`}
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
        <SheetContent 
          side="bottom" 
          className="h-[95vh] w-full flex flex-col p-0"
        >
          <SheetHeader className="p-4 pb-2 border-b bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <SheetTitle className="text-left text-lg">Предпросмотр заказа</SheetTitle>
                <SheetDescription className="text-left text-sm mt-1">
                  Проверьте все данные перед созданием
                </SheetDescription>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          
          <ScrollArea className="flex-1 px-4">
            <PreviewContent />
          </ScrollArea>
          
          {/* Fixed bottom actions */}
          <div className="sticky bottom-0 bg-white border-t p-4 z-20">
            <div className="flex gap-3">
              <ActionButtons />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-xl">Предпросмотр заказа</DialogTitle>
          <DialogDescription>
            Проверьте все данные перед созданием заказа
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 max-h-[calc(95vh-180px)]">
          <PreviewContent />
        </ScrollArea>
        
        <DialogFooter className="p-6 pt-4 border-t bg-gray-50">
          <div className="flex justify-between gap-3 w-full">
            <ActionButtons />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
