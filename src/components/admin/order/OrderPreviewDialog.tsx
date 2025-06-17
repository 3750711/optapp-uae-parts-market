
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, DollarSign, Truck, MapPin, Clock, Camera, User, Star, X } from 'lucide-react';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';
import { ScrollArea } from '@/components/ui/scroll-area';

interface OrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  images: string[];
  videos?: string[];
  selectedSeller: any;
  buyerProfile: any;
  onConfirm: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export const OrderPreviewDialog: React.FC<OrderPreviewDialogProps> = ({
  open,
  onOpenChange,
  formData,
  images,
  videos = [],
  selectedSeller,
  buyerProfile,
  onConfirm,
  isLoading = false
}) => {
  const getDeliveryMethodText = (method: string) => {
    switch (method) {
      case 'self_pickup': return 'Самовывоз';
      case 'cargo_rf': return 'Карго РФ';
      case 'cargo_kz': return 'Карго КЗ';
      default: return method;
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(e);
  };

  const isSelfOrder = formData.sellerId === formData.buyerId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-2xl font-bold text-blue-700 flex items-center gap-3">
            Предпросмотр заказа
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1 text-sm font-medium border">
              Черновик
            </Badge>
            {isSelfOrder && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <Star className="h-3 w-3 mr-1" />
                Самозаказ
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product Information */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="text-xl font-semibold">Информация о товаре</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Наименование</div>
                          <div className="font-medium text-lg">{formData.title || 'Не указано'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Бренд</div>
                          <div className="font-medium">{formData.brand || 'Не указан'}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Модель</div>
                          <div className="font-medium">{formData.model || 'Не указана'}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Цена товара</div>
                          <div className="font-bold text-2xl text-green-600 flex items-center gap-1">
                            <DollarSign className="h-5 w-5" />
                            {formData.price || '0'}
                          </div>
                        </div>
                        {formData.deliveryPriceConfirm && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Стоимость доставки</div>
                            <div className="font-semibold text-lg text-green-600 flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              ${formData.deliveryPriceConfirm}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Количество мест</div>
                          <div className="font-medium">{formData.placeNumber || 1}</div>
                        </div>
                      </div>
                    </div>
                    
                    {formData.textOrder && (
                      <div className="mt-6 pt-6 border-t">
                        <div className="text-sm text-muted-foreground mb-2">Дополнительная информация</div>
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{formData.textOrder}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Media */}
                {(images.length > 0 || videos.length > 0) && (
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Camera className="h-5 w-5 text-primary" />
                        <h3 className="text-xl font-semibold">Медиафайлы</h3>
                        <Badge variant="outline" className="ml-2">
                          {images.length + videos.length} файлов
                        </Badge>
                      </div>
                      
                      {images.length > 0 && (
                        <div className="mb-6">
                          <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Фотографии ({images.length})
                          </div>
                          <OptimizedOrderImages images={images} />
                        </div>
                      )}
                      
                      {videos.length > 0 && (
                        <div>
                          <OptimizedOrderVideos videos={videos} />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Participants */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Участники</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Seller */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="font-medium text-blue-800">Продавец</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Имя:</span>
                            <span className="ml-2 font-medium">{selectedSeller?.full_name || 'Не указано'}</span>
                          </div>
                          {selectedSeller?.opt_id && (
                            <div>
                              <span className="text-muted-foreground">OPT ID:</span>
                              <span className="ml-2 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                                {selectedSeller.opt_id}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Buyer */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="font-medium text-green-800">Покупатель</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          {buyerProfile?.opt_id && (
                            <div>
                              <span className="text-muted-foreground">OPT ID:</span>
                              <span className="ml-2 font-mono text-xs bg-green-100 px-2 py-1 rounded">
                                {buyerProfile.opt_id}
                              </span>
                            </div>
                          )}
                          {formData.telegramUrlOrder && (
                            <div>
                              <span className="text-muted-foreground">Telegram:</span>
                              <span className="ml-2 text-blue-600">{formData.telegramUrlOrder}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Information */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Truck className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Доставка</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="font-medium text-yellow-800 mb-2">Способ доставки</div>
                        <div className="text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-yellow-600" />
                          {getDeliveryMethodText(formData.deliveryMethod)}
                        </div>
                      </div>
                      
                      {/* Container Information */}
                      {formData.containerNumber && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded text-white text-sm font-bold">
                              OPTCargo
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1">Номер контейнера</div>
                              <div className="font-mono text-lg font-semibold text-yellow-800 bg-yellow-100 px-3 py-1 rounded">
                                {formData.containerNumber}
                              </div>
                            </div>
                            
                            {formData.containerStatus && (
                              <div>
                                <div className="text-sm text-muted-foreground mb-1">Статус контейнера</div>
                                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 border">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formData.containerStatus}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end space-x-4 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Вернуться к редактированию
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Создание заказа...' : 'Создать заказ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
