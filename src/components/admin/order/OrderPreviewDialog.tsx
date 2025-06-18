
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
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { Loader2, CheckCircle, Package, DollarSign, User, Camera, X, Image as ImageIcon, Play } from 'lucide-react';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';

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

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup': return 'Самовывоз';
      case 'cargo_rf': return 'Cargo РФ';
      case 'cargo_kz': return 'Cargo КЗ';
      default: return method;
    }
  };

  const formatPrice = (price?: string) => {
    if (!price || isNaN(parseFloat(price))) return '0';
    return parseFloat(price).toLocaleString('ru-RU');
  };

  const MediaThumbnail = ({ url, type }: { url: string; type: 'image' | 'video' }) => (
    <div className="relative w-8 h-8 rounded border overflow-hidden bg-gray-100 flex-shrink-0">
      {type === 'image' ? (
        <>
          <img src={url} alt="Изображение" className="w-full h-full object-cover" />
          <div className="absolute top-0 left-0 bg-blue-500 text-white rounded-br text-xs leading-none w-2 h-2">
          </div>
        </>
      ) : (
        <>
          <video src={url} className="w-full h-full object-cover" preload="metadata" muted />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <Play className="w-2 h-2 text-white" />
          </div>
          <div className="absolute top-0 left-0 bg-red-500 text-white rounded-br text-xs leading-none w-2 h-2">
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
              Предварительный просмотр заказа
            </h1>
            <p className="text-xs text-blue-700 mt-1">
              Проверьте все данные перед созданием
            </p>
          </div>
        </div>
      </div>

      {/* Compact Order Information */}
      <Card className="border border-gray-200">
        <CardContent className="p-3 space-y-3">
          {/* Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Информация о заказе</span>
            </div>
            <div className="text-base font-semibold text-gray-900 leading-tight">
              {formData.title || 'Не указано'}
            </div>
          </div>

          <Separator className="my-2" />

          {/* Compact Brand & Model */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Бренд:</span>
              <div className="font-medium">{formData.brand || 'Не указан'}</div>
            </div>
            <div>
              <span className="text-gray-500">Модель:</span>
              <div className="font-medium">{formData.model || 'Не указана'}</div>
            </div>
          </div>

          {/* Delivery & Places */}
          {(formData.deliveryMethod || formData.place_number) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {formData.deliveryMethod && (
                <div>
                  <span className="text-gray-500">Доставка:</span>
                  <div className="font-medium">{getDeliveryMethodLabel(formData.deliveryMethod)}</div>
                </div>
              )}
              {formData.place_number && (
                <div>
                  <span className="text-gray-500">Мест:</span>
                  <div className="font-medium">{formData.place_number}</div>
                </div>
              )}
            </div>
          )}

          <Separator className="my-2" />

          {/* Financial info in compact grid */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Финансы</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">${formatPrice(formData.price)}</div>
                <div className="text-xs text-gray-500">Цена</div>
              </div>
              {formData.delivery_price && parseFloat(formData.delivery_price) > 0 && (
                <div className="text-center">
                  <div className="text-sm font-semibold">${formatPrice(formData.delivery_price)}</div>
                  <div className="text-xs text-gray-500">Доставка</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm font-medium">{formData.buyerOptId || 'Не указано'}</div>
                <div className="text-xs text-gray-500">OPT ID</div>
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Compact Participants */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Участники</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-2 rounded text-sm">
                <div className="text-xs text-gray-500 mb-1">Продавец</div>
                <div className="font-medium leading-tight">{selectedSeller?.full_name || 'Не указан'}</div>
                {selectedSeller?.opt_id && (
                  <div className="text-xs text-gray-500 font-mono">ID: {selectedSeller.opt_id}</div>
                )}
              </div>
              <div className="bg-green-50 p-2 rounded text-sm">
                <div className="text-xs text-gray-500 mb-1">Покупатель</div>
                <div className="font-medium leading-tight">{buyerProfile?.full_name || 'Не указан'}</div>
                {buyerProfile?.opt_id && (
                  <div className="text-xs text-gray-500 font-mono">ID: {buyerProfile.opt_id}</div>
                )}
              </div>
            </div>
          </div>

          {/* Description if exists */}
          {formData.text_order && (
            <>
              <Separator className="my-2" />
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Дополнительно</div>
                <div className="bg-gray-50 p-2 rounded text-sm max-h-12 overflow-y-auto">
                  <p className="whitespace-pre-wrap text-gray-700">{formData.text_order}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ultra Compact Media Section */}
      {(images.length > 0 || videos.length > 0) && (
        <Card className="border border-gray-200">
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Camera className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Медиафайлы</span>
              </div>
              <div className="text-xs text-gray-500">
                {images.length + videos.length} файлов
              </div>
            </div>
            
            <div className="space-y-2">
              {/* Ultra compact combined view */}
              <div className="flex flex-wrap gap-1">
                {/* Show first few images */}
                {images.slice(0, 6).map((url, index) => (
                  <MediaThumbnail key={`image-${index}`} url={url} type="image" />
                ))}
                
                {/* Show first few videos */}
                {videos.slice(0, 3).map((url, index) => (
                  <MediaThumbnail key={`video-${index}`} url={url} type="video" />
                ))}
                
                {/* Show remaining count if there are more files */}
                {(images.length + videos.length > 9) && (
                  <div className="w-8 h-8 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                    +{images.length + videos.length - 9}
                  </div>
                )}
              </div>

              {/* Compact summary */}
              <div className="text-xs text-gray-500 flex items-center gap-3">
                {images.length > 0 && (
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {images.length} фото
                  </span>
                )}
                {videos.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Play className="w-3 h-3" />
                    {videos.length} видео
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const ActionButtons = () => (
    <>
      <Button variant="outline" onClick={onBack} disabled={isLoading} className="h-10">
        Назад к редактированию
      </Button>
      <Button onClick={onConfirm} disabled={isLoading} className="h-10 bg-green-600 hover:bg-green-700">
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
        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-3">
          <SheetHeader className="text-left pb-2 flex-shrink-0">
            <SheetTitle className="text-base">Предпросмотр заказа</SheetTitle>
            <SheetDescription className="text-xs">
              Проверьте данные перед созданием
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="text-base">Предпросмотр заказа</DialogTitle>
          <DialogDescription className="text-sm">
            Проверьте данные перед созданием заказа
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-4 px-4 max-h-[60vh]">
          <PreviewContent />
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 flex justify-between gap-3 pt-3 border-t">
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
