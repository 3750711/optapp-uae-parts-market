
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, CheckCircle, Package, DollarSign, User, Camera, X, Truck, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-blue-800 mb-2">
                Предварительный просмотр заказа
              </h1>
              <p className="text-blue-700">
                Проверьте все данные перед созданием заказа
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основная информация */}
        <div className="space-y-6">
          {/* Информация о товаре */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Информация о товаре
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Наименование</div>
                  <div className="font-medium">{formData.title || 'Не указано'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Цена товара</div>
                  <div className="text-2xl font-bold text-green-600">${formatPrice(formData.price)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Бренд</div>
                  <div className="font-medium">{formData.brand || 'Не указан'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Модель</div>
                  <div className="font-medium">{formData.model || 'Не указана'}</div>
                </div>
              </div>

              {formData.delivery_price && parseFloat(formData.delivery_price) > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Стоимость доставки</div>
                  <div className="text-lg font-semibold text-orange-600">${formatPrice(formData.delivery_price)}</div>
                </div>
              )}

              {formData.place_number && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Количество мест</div>
                  <div className="font-medium">{formData.place_number}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Участники заказа */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Участники заказа
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Продавец */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium text-blue-800">Продавец</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Имя:</span>
                    <span className="ml-2 font-medium">{selectedSeller?.full_name || 'Не указан'}</span>
                  </div>
                  {selectedSeller?.opt_id && (
                    <div>
                      <span className="text-sm text-muted-foreground">OPT ID:</span>
                      <Badge variant="outline" className="ml-2 font-mono text-xs">
                        {selectedSeller.opt_id}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Покупатель */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-medium text-green-800">Покупатель</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Имя:</span>
                    <span className="ml-2 font-medium">{buyerProfile?.full_name || 'Не указан'}</span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">OPT ID:</span>
                    <Badge variant="outline" className="ml-2 font-mono text-xs">
                      {formData.buyerOptId || 'Не указан'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Медиафайлы и дополнительная информация */}
        <div className="space-y-6">
          {/* Фотографии заказа */}
          {images.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5 text-primary" />
                  Фотографии заказа ({images.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="aspect-square relative overflow-hidden rounded-lg border">
                      <img
                        src={image}
                        alt={`Фото заказа ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => window.open(image, '_blank')}
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Видео заказа */}
          {videos.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Видео заказа ({videos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {videos.map((video, index) => (
                    <div key={index} className="relative">
                      <video
                        src={video}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: '200px' }}
                      />
                      <div className="mt-2 text-sm text-muted-foreground">
                        Видео {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Доставка */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Truck className="h-5 w-5 text-primary" />
                Информация о доставке
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    {getDeliveryMethodLabel(formData.deliveryMethod)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Дополнительная информация */}
          {formData.text_order && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Дополнительная информация</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{formData.text_order}</p>
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
      <Button variant="outline" onClick={onBack} disabled={isLoading}>
        Назад к редактированию
      </Button>
      <Button onClick={onConfirm} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
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
        <SheetContent side="bottom" className="h-[95vh] w-full flex flex-col p-0">
          <SheetHeader className="p-4 pb-2">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-lg">Предпросмотр заказа</SheetTitle>
                <SheetDescription className="text-sm">
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
          
          <ScrollArea className="flex-1 px-4">
            <PreviewContent />
          </ScrollArea>
          
          <div className="p-4 border-t bg-white">
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
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Предпросмотр заказа</DialogTitle>
          <DialogDescription>
            Проверьте все данные перед созданием заказа
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <PreviewContent />
        </ScrollArea>
        
        <Separator className="my-4" />
        
        <DialogFooter className="flex justify-between gap-3">
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
