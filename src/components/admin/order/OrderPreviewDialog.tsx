
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
import { Loader2, CheckCircle, Package, DollarSign, User, Camera, X, Truck, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

// Мемоизированный компонент для медиафайлов
const MediaSection = React.memo(({ 
  images, 
  videos, 
  isMobile 
}: { 
  images: string[]; 
  videos: string[]; 
  isMobile: boolean; 
}) => {
  const [mediaOpen, setMediaOpen] = React.useState(true);

  if (images.length === 0 && videos.length === 0) return null;

  return (
    <Card>
      <Collapsible open={mediaOpen} onOpenChange={setMediaOpen}>
        <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'} cursor-pointer`}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                <Camera className="h-5 w-5 text-primary" />
                Медиафайлы ({images.length + videos.length})
              </CardTitle>
              {mediaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={isMobile ? 'pt-0 pb-4' : ''}>
            {/* Фотографии */}
            {images.length > 0 && (
              <div className="mb-6">
                <h4 className={`font-medium mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Фотографии ({images.length})
                </h4>
                <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {images.map((image, index) => (
                    <div key={index} className="aspect-square relative overflow-hidden rounded-lg border">
                      <img
                        src={image}
                        alt={`Фото заказа ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => window.open(image, '_blank')}
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Видео */}
            {videos.length > 0 && (
              <div>
                <h4 className={`font-medium mb-3 ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Видео ({videos.length})
                </h4>
                <div className="space-y-3">
                  {videos.map((video, index) => (
                    <div key={index} className="relative">
                      <video
                        src={video}
                        controls
                        className="w-full rounded-lg"
                        style={{ maxHeight: isMobile ? '150px' : '200px' }}
                      />
                      <div className={`mt-2 text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        Видео {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

MediaSection.displayName = 'MediaSection';

// Мемоизированный компонент информации о товаре
const ProductInfoSection = React.memo(({ 
  formData, 
  isMobile 
}: { 
  formData: any; 
  isMobile: boolean; 
}) => {
  const [productOpen, setProductOpen] = React.useState(true);

  const formatPrice = (price?: string) => {
    if (!price || isNaN(parseFloat(price))) return '0';
    return parseFloat(price).toLocaleString('ru-RU');
  };

  return (
    <Card>
      <Collapsible open={productOpen} onOpenChange={setProductOpen}>
        <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'} cursor-pointer`}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                <Package className="h-5 w-5 text-primary" />
                Информация о товаре
              </CardTitle>
              {productOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={`space-y-4 ${isMobile ? 'pt-0 pb-4' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={`text-muted-foreground mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Наименование</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formData.title || 'Не указано'}</div>
              </div>
              <div>
                <div className={`text-muted-foreground mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Цена товара</div>
                <div className={`font-bold text-green-600 ${isMobile ? 'text-lg' : 'text-2xl'}`}>${formatPrice(formData.price)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className={`text-muted-foreground mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Бренд</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formData.brand || 'Не указан'}</div>
              </div>
              <div>
                <div className={`text-muted-foreground mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Модель</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formData.model || 'Не указана'}</div>
              </div>
            </div>

            {formData.delivery_price && parseFloat(formData.delivery_price) > 0 && (
              <div>
                <div className={`text-muted-foreground mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Стоимость доставки</div>
                <div className={`font-semibold text-orange-600 ${isMobile ? 'text-base' : 'text-lg'}`}>${formatPrice(formData.delivery_price)}</div>
              </div>
            )}

            {formData.place_number && (
              <div>
                <div className={`text-muted-foreground mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Количество мест</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formData.place_number}</div>
              </div>
            )}

            {formData.text_order && (
              <div>
                <div className={`text-muted-foreground mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Дополнительная информация</div>
                <div className={`bg-muted/30 p-3 rounded-lg ${isMobile ? 'text-sm' : ''}`}>
                  <p className="whitespace-pre-wrap">{formData.text_order}</p>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

ProductInfoSection.displayName = 'ProductInfoSection';

// Мемоизированный компонент участников заказа
const ParticipantsSection = React.memo(({ 
  selectedSeller, 
  buyerProfile, 
  formData, 
  isMobile 
}: { 
  selectedSeller: any; 
  buyerProfile: any; 
  formData: any; 
  isMobile: boolean; 
}) => {
  const [participantsOpen, setParticipantsOpen] = React.useState(true);

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

  return (
    <Card>
      <Collapsible open={participantsOpen} onOpenChange={setParticipantsOpen}>
        <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'} cursor-pointer`}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-lg'}`}>
                <User className="h-5 w-5 text-primary" />
                Участники и доставка
              </CardTitle>
              {participantsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className={`space-y-4 ${isMobile ? 'pt-0 pb-4' : ''}`}>
            {/* Продавец */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className={`font-medium text-blue-800 ${isMobile ? 'text-sm' : ''}`}>Продавец</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Имя:</span>
                  <span className={`ml-2 font-medium ${isMobile ? 'text-sm' : ''}`}>{selectedSeller?.full_name || 'Не указан'}</span>
                </div>
                {selectedSeller?.opt_id && (
                  <div>
                    <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>OPT ID:</span>
                    <Badge variant="outline" className={`ml-2 font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>
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
                <span className={`font-medium text-green-800 ${isMobile ? 'text-sm' : ''}`}>Покупатель</span>
              </div>
              <div className="space-y-2">
                <div>
                  <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>Имя:</span>
                  <span className={`ml-2 font-medium ${isMobile ? 'text-sm' : ''}`}>{buyerProfile?.full_name || 'Не указан'}</span>
                </div>
                <div>
                  <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>OPT ID:</span>
                  <Badge variant="outline" className={`ml-2 font-mono ${isMobile ? 'text-xs' : 'text-xs'}`}>
                    {formData.buyerOptId || 'Не указан'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Доставка */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-yellow-600" />
                <span className={`font-medium text-yellow-800 ${isMobile ? 'text-sm' : ''}`}>
                  {getDeliveryMethodLabel(formData.deliveryMethod)}
                </span>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
});

ParticipantsSection.displayName = 'ParticipantsSection';

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

  const PreviewContent = React.memo(() => (
    <div className={`space-y-4 ${isMobile ? 'space-y-3' : 'space-y-6'}`}>
      {/* Header Card */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className={isMobile ? 'p-4' : 'p-6'}>
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center justify-center bg-blue-100 rounded-full ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}>
              <CheckCircle className={`text-blue-600 ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
            </div>
            <div className="text-center">
              <h1 className={`font-bold text-blue-800 mb-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                Предварительный просмотр заказа
              </h1>
              <p className={`text-blue-700 ${isMobile ? 'text-sm' : ''}`}>
                Проверьте все данные перед созданием заказа
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped content sections */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} ${isMobile ? 'gap-3' : 'gap-6'}`}>
        <div className="space-y-4">
          <ProductInfoSection formData={formData} isMobile={isMobile} />
          <ParticipantsSection 
            selectedSeller={selectedSeller} 
            buyerProfile={buyerProfile} 
            formData={formData} 
            isMobile={isMobile} 
          />
        </div>
        
        {!isMobile && (
          <div className="space-y-4">
            <MediaSection images={images} videos={videos} isMobile={isMobile} />
          </div>
        )}
      </div>

      {/* Media section for mobile - after main content */}
      {isMobile && (
        <MediaSection images={images} videos={videos} isMobile={isMobile} />
      )}
    </div>
  ));

  PreviewContent.displayName = 'PreviewContent';

  const ActionButtons = React.memo(() => (
    <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'justify-between'}`}>
      <Button 
        variant="outline" 
        onClick={onBack} 
        disabled={isLoading}
        size={isMobile ? "lg" : "default"}
        className={isMobile ? "w-full min-h-[48px]" : ""}
      >
        Назад к редактированию
      </Button>
      <Button 
        onClick={onConfirm} 
        disabled={isLoading} 
        className={`bg-green-600 hover:bg-green-700 ${isMobile ? "w-full min-h-[48px]" : ""}`}
        size={isMobile ? "lg" : "default"}
      >
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
    </div>
  ));

  ActionButtons.displayName = 'ActionButtons';

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className={`flex flex-col p-0 ${isMobile ? 'h-[95vh]' : 'h-[90vh]'} w-full`}>
          <SheetHeader className={`p-4 pb-2 ${isMobile ? 'px-3' : ''}`}>
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className={isMobile ? 'text-base' : 'text-lg'}>Предпросмотр заказа</SheetTitle>
                <SheetDescription className={isMobile ? 'text-xs' : 'text-sm'}>
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
          
          <ScrollArea className={`flex-1 ${isMobile ? 'px-3' : 'px-4'}`}>
            <PreviewContent />
          </ScrollArea>
          
          <div className={`border-t bg-white ${isMobile ? 'p-3' : 'p-4'}`}>
            <ActionButtons />
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
        
        <DialogFooter>
          <ActionButtons />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
