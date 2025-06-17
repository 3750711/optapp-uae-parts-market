
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
import { Loader2, CheckCircle, Package, DollarSign, User, Calendar, Camera, X } from 'lucide-react';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';
import { MobileFormSection } from './MobileFormSection';
import {
  getOrderNumberFormatted,
  formatOrderPrice
} from '@/utils/orderUtils';

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

  // Функция для отображения метода доставки
  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup':
        return 'Самовывоз';
      case 'cargo_rf':
        return 'Cargo РФ';
      case 'cargo_kz':
        return 'Cargo КЗ';
      default:
        return method;
    }
  };

  // Функция для отображения бренда с fallback
  const getBrandDisplay = () => {
    if (!formData.brand || formData.brand.trim() === '') return 'Не указан';
    return formData.brand;
  };

  // Функция для отображения модели с fallback
  const getModelDisplay = () => {
    if (!formData.model || formData.model.trim() === '') return 'Не указана';
    return formData.model;
  };

  // Функция для форматирования цены
  const formatPrice = (price?: string) => {
    if (!price || isNaN(parseFloat(price))) return '0';
    return parseFloat(price).toLocaleString('ru-RU');
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
                Предварительный просмотр заказа
              </h1>
              <p className={`text-blue-700 ${isMobile ? 'text-sm' : ''}`}>
                Проверьте все данные перед созданием заказа
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <div className="space-y-4">
        {/* Basic Information */}
        <MobileFormSection 
          title="Информация о заказе" 
          icon={<Package className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Наименование</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formData.title || 'Не указано'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Бренд</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{getBrandDisplay()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Модель</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{getModelDisplay()}</div>
            </div>
            {formData.deliveryMethod && (
              <div>
                <div className="text-xs text-muted-foreground">Метод доставки</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{getDeliveryMethodLabel(formData.deliveryMethod)}</div>
              </div>
            )}
            {formData.place_number && (
              <div>
                <div className="text-xs text-muted-foreground">Количество мест</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formData.place_number}</div>
              </div>
            )}
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
              <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>${formatPrice(formData.price)}</div>
            </div>
            {formData.delivery_price && parseFloat(formData.delivery_price) > 0 && (
              <div>
                <div className="text-xs text-muted-foreground">Стоимость доставки</div>
                <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold`}>${formatPrice(formData.delivery_price)}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">OPT ID покупателя</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formData.buyerOptId || 'Не указано'}</div>
            </div>
          </div>
        </MobileFormSection>

        {/* Participants */}
        <MobileFormSection 
          title="Участники заказа" 
          icon={<User className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div className={`bg-blue-50 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
              <div className="text-xs text-muted-foreground mb-1">Продавец</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{selectedSeller?.full_name || 'Не указан'}</div>
              {selectedSeller?.opt_id && (
                <div className={`text-xs text-muted-foreground font-mono ${isMobile ? 'text-xs' : ''}`}>
                  OPT_ID: {selectedSeller.opt_id}
                </div>
              )}
            </div>
            <div className={`bg-green-50 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
              <div className="text-xs text-muted-foreground mb-1">Покупатель</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{buyerProfile?.full_name || 'Не указан'}</div>
              {buyerProfile?.opt_id && (
                <div className={`text-xs text-muted-foreground font-mono ${isMobile ? 'text-xs' : ''}`}>
                  OPT_ID: {buyerProfile.opt_id}
                </div>
              )}
            </div>
          </div>
        </MobileFormSection>

        {/* Additional Information */}
        <MobileFormSection 
          title="Дополнительная информация"
          defaultOpen={true}
        >
          <div>
            {formData.text_order ? (
              <div className={`bg-muted/30 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
                <p className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : ''}`}>{formData.text_order}</p>
              </div>
            ) : (
              <div className={`text-xs text-muted-foreground italic ${isMobile ? 'text-xs' : 'text-sm'}`}>
                Дополнительная информация не указана
              </div>
            )}
          </div>
        </MobileFormSection>

        {/* Media Section */}
        {(images.length > 0 || videos.length > 0) && (
          <MobileFormSection 
            title={`Медиафайлы заказа (${images.length + videos.length})`}
            icon={<Camera className="h-4 w-4" />}
            defaultOpen={true}
          >
            <div className="space-y-4">
              {images.length > 0 && (
                <div>
                  <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium mb-3`}>Изображения ({images.length})</h3>
                  <OptimizedOrderImages images={images} />
                </div>
              )}

              {videos.length > 0 && (
                <div>
                  <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-medium mb-3`}>Видео ({videos.length})</h3>
                  <OptimizedOrderVideos videos={videos} />
                </div>
              )}
            </div>
          </MobileFormSection>
        )}
      </div>
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button variant="outline" onClick={onBack} disabled={isLoading} className={`${isMobile ? 'h-12 text-sm' : 'h-11'}`}>
        Назад к редактированию
      </Button>
      <Button onClick={onConfirm} disabled={isLoading} className={`${isMobile ? 'h-12 text-sm' : 'h-11'} bg-green-600 hover:bg-green-700`}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Создание заказа...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Подтвердить и создать заказ
          </>
        )}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[95vh] w-full flex flex-col p-4">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-lg">Предпросмотр заказа</SheetTitle>
            <SheetDescription className="text-sm">
              Проверьте данные перед созданием заказа
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Предпросмотр заказа</DialogTitle>
          <DialogDescription>
            Проверьте данные перед созданием заказа
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
