
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, DollarSign, User, Calendar, Plus, Camera, Upload } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFormSection } from './MobileFormSection';
import { EnhancedOrderStatusBadge } from './EnhancedOrderStatusBadge';
import { ConfirmationImagesUploadDialog } from '@/components/admin/ConfirmationImagesUploadDialog';
import { CreatedOrderMediaSection } from './CreatedOrderMediaSection';

interface CreatedOrderViewProps {
  order: any;
  images: string[];
  videos?: string[];
  onNewOrder: () => void;
  onOrderUpdate?: (order: any) => void;
  buyerProfile?: any;
}

export const CreatedOrderView: React.FC<CreatedOrderViewProps> = ({
  order,
  images,
  videos = [],
  onNewOrder,
  onOrderUpdate,
  buyerProfile
}) => {
  const isMobile = useIsMobile();
  const [showConfirmationUpload, setShowConfirmationUpload] = useState(false);
  const [currentImages, setCurrentImages] = useState(images);
  const [currentVideos, setCurrentVideos] = useState(videos);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBuyerDisplayInfo = () => {
    if (buyerProfile) {
      return {
        name: buyerProfile.full_name || 'Не указано',
        optId: buyerProfile.opt_id || 'Не указан'
      };
    }
    
    return {
      name: order.buyer_opt_id || 'Не указано',
      optId: order.buyer_opt_id || 'Не указан'
    };
  };

  const handleConfirmationUploadComplete = () => {
    setShowConfirmationUpload(false);
  };

  const handleConfirmationUploadSkip = () => {
    setShowConfirmationUpload(false);
  };

  // Защитная функция для получения номера заказа
  const getOrderNumber = () => {
    if (!order.order_number) return 'Не указан';
    return order.order_number.toString().toUpperCase();
  };

  // Функция для отображения бренда с fallback
  const getBrandDisplay = () => {
    if (!order.brand || order.brand.trim() === '') return 'Не указан';
    return order.brand;
  };

  // Функция для отображения модели с fallback
  const getModelDisplay = () => {
    if (!order.model || order.model.trim() === '') return 'Не указана';
    return order.model;
  };

  const buyerInfo = getBuyerDisplayInfo();

  const handleImagesUpdate = (newImages: string[]) => {
    setCurrentImages(newImages);
    // TODO: Here you could update the order in the database
    console.log('📸 Order images updated:', newImages);
  };

  const handleVideosUpdate = (newVideos: string[]) => {
    setCurrentVideos(newVideos);
    // TODO: Here you could update the order in the database
    console.log('🎥 Order videos updated:', newVideos);
  };

  return (
    <div className={`space-y-4 ${isMobile ? 'pb-24' : ''}`}>
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className={`${isMobile ? 'p-4' : 'pt-6'}`}>
          <div className={`flex items-center ${isMobile ? 'flex-col text-center space-y-3' : 'justify-center space-x-4'}`}>
            <div className={`flex items-center justify-center ${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-green-100 rounded-full`}>
              <CheckCircle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-green-600`} />
            </div>
            <div className={isMobile ? 'text-center' : ''}>
              <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-800 mb-2`}>
                Заказ успешно создан!
              </h1>
              <p className={`text-green-700 mb-4 ${isMobile ? 'text-sm' : ''}`}>
                Заказ #{getOrderNumber()} готов к обработке
              </p>
              
              {/* Подпишите проданный товар section */}
              <div className={`bg-yellow-50 border border-yellow-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'} mb-4`}>
                <h3 className={`font-bold text-yellow-800 mb-3 ${isMobile ? 'text-sm' : ''}`}>
                  ПОДПИШИТЕ ПРОДАННЫЙ ТОВАР:
                </h3>
                <div className="space-y-2">
                  <div className={`bg-white rounded-lg ${isMobile ? 'p-2' : 'p-3'} border-2 border-yellow-300`}>
                    <div className={`text-yellow-700 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>OPT ID ПОКУПАТЕЛЯ:</div>
                    <div className={`font-bold text-yellow-900 tracking-wider ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                      {buyerInfo.optId.toUpperCase()}
                    </div>
                  </div>
                  <div className={`bg-white rounded-lg ${isMobile ? 'p-2' : 'p-3'} border-2 border-yellow-300`}>
                    <div className={`text-yellow-700 font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>НОМЕР ЗАКАЗА:</div>
                    <div className={`font-bold text-yellow-900 tracking-wider ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                      {getOrderNumber()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload confirmation photos button */}
              <Button
                onClick={() => setShowConfirmationUpload(true)}
                variant="secondary"
                size={isMobile ? "default" : "lg"}
                className={`${isMobile ? 'w-full h-12 text-sm' : 'w-full'} bg-blue-600 hover:bg-blue-700 text-white`}
              >
                <Camera className="mr-2 h-4 w-4" />
                Загрузить подтверждающие фото
              </Button>
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
              <div className="text-xs text-muted-foreground">Номер заказа</div>
              <div className={`font-mono font-bold ${isMobile ? 'text-base' : 'text-lg'}`}>{getOrderNumber()}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Наименование</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{order.title}</div>
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
              <EnhancedOrderStatusBadge status={order.status} size="md" />
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
              <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>${order.price}</div>
            </div>
            {order.delivery_price_confirm && (
              <div>
                <div className="text-xs text-muted-foreground">Стоимость доставки</div>
                <div className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold`}>${order.delivery_price_confirm}</div>
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Количество мест</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{order.place_number || 1}</div>
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
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{order.order_seller_name || 'Не указан'}</div>
              {order.seller_opt_id && (
                <div className={`text-xs text-muted-foreground font-mono ${isMobile ? 'text-xs' : ''}`}>
                  OPT_ID: {order.seller_opt_id}
                </div>
              )}
            </div>
            <div className={`bg-green-50 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
              <div className="text-xs text-muted-foreground mb-1">Покупатель</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{buyerInfo.name}</div>
              <div className={`text-xs text-muted-foreground font-mono ${isMobile ? 'text-xs' : ''}`}>
                OPT_ID: {buyerInfo.optId}
              </div>
            </div>
          </div>
        </MobileFormSection>

        {/* Timeline */}
        <MobileFormSection 
          title="Временная линия" 
          icon={<Calendar className="h-4 w-4" />}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Дата создания</div>
              <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formatDate(order.created_at)}</div>
            </div>
            {order.updated_at && order.updated_at !== order.created_at && (
              <div>
                <div className="text-xs text-muted-foreground">Последнее обновление</div>
                <div className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{formatDate(order.updated_at)}</div>
              </div>
            )}
          </div>
        </MobileFormSection>
      </div>

      {/* Enhanced Media Section with upload buttons */}
      <MobileFormSection 
        title="Медиафайлы заказа"
        icon={<Camera className="h-4 w-4" />}
        defaultOpen={true}
      >
        <CreatedOrderMediaSection
          orderId={order.id}
          images={currentImages}
          videos={currentVideos}
          onImagesUpdate={handleImagesUpdate}
          onVideosUpdate={handleVideosUpdate}
        />
      </MobileFormSection>

      {/* Additional Information */}
      {order.text_order && (
        <MobileFormSection 
          title="Дополнительная информация"
          defaultOpen={true}
        >
          <div className={`bg-muted/30 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
            <p className={`whitespace-pre-wrap ${isMobile ? 'text-sm' : ''}`}>{order.text_order}</p>
          </div>
        </MobileFormSection>
      )}

      {/* Actions */}
      {isMobile ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <Button
            onClick={onNewOrder}
            size="lg"
            className="w-full h-12 text-sm font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать новый заказ
          </Button>
        </div>
      ) : (
        <div className="flex justify-center pt-6 border-t">
          <Button
            onClick={onNewOrder}
            size="lg"
            className="min-w-[200px]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать новый заказ
          </Button>
        </div>
      )}

      {/* Confirmation Images Upload Dialog */}
      <ConfirmationImagesUploadDialog
        open={showConfirmationUpload}
        orderId={order.id}
        onComplete={handleConfirmationUploadComplete}
        onSkip={handleConfirmationUploadSkip}
        onCancel={() => setShowConfirmationUpload(false)}
      />
    </div>
  );
};
