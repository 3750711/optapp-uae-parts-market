
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Package, DollarSign, MapPin, Truck, Clock, Camera, Film, Share2, Download } from 'lucide-react';
import { OrderConfirmationImages } from '@/components/order/OrderConfirmationImages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const [showConfirmImages, setShowConfirmImages] = React.useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Order ID is required');
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:buyer_id(telegram, full_name, opt_id, email, phone),
          seller:seller_id(telegram, full_name, opt_id, email, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: images = [] } = useQuery({
    queryKey: ['order-images', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('order_images')
        .select('url')
        .eq('order_id', id);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    },
    enabled: !!id
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['order-videos', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('order_videos')
        .select('url')
        .eq('order_id', id);

      if (error) throw error;
      return data?.map(video => video.url) || [];
    },
    enabled: !!id
  });

  const { data: confirmImages = [] } = useQuery({
    queryKey: ['confirm-images', id],
    queryFn: async () => {
      if (!profile || profile.user_type !== 'admin') return [];
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', id);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    },
    enabled: !!id && profile?.user_type === 'admin'
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="text-center text-red-600">
            Заказ не найден или произошла ошибка при загрузке
          </div>
        </div>
      </Layout>
    );
  }

  const isAdmin = profile?.user_type === 'admin';
  const isAuthorized = !!user;
  const orderImages = order.images || [];
  const allVideos = [...(order.video_url || []), ...videos];
  const allImages = [...orderImages, ...images];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'delivered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created': return 'Создан';
      case 'confirmed': return 'Подтвержден';
      case 'cancelled': return 'Отменен';
      case 'delivered': return 'Доставлен';
      default: return status;
    }
  };

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup': return 'Самовывоз';
      case 'cargo_rf': return 'Cargo РФ';
      case 'cargo_kz': return 'Cargo KZ';
      default: return method;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center relative">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-4xl font-bold text-gray-800">№ {order.order_number}</div>
                <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <div className="text-gray-600 text-sm">
                Создан {new Date(order.created_at).toLocaleDateString('ru-RU')}
              </div>
              
              {/* Admin Actions */}
              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmImages(true)}
                    className="text-xs"
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Подтв. фото ({confirmImages.length})
                  </Button>
                </div>
              )}
            </div>

            <div className="p-8 space-y-8">
              {/* Product Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <Package className="h-5 w-5" />
                  Информация о товаре
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">Наименование</div>
                      <div className="font-medium">{order.title}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Бренд</div>
                      <div className="font-medium">{order.brand}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Модель</div>
                      <div className="font-medium">{order.model}</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-500">Цена</div>
                      <div className="font-bold text-lg text-green-600">${order.price}</div>
                    </div>
                    {order.delivery_price_confirm && (
                      <div>
                        <div className="text-sm text-gray-500">Стоимость доставки</div>
                        <div className="font-medium text-green-600">${order.delivery_price_confirm}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-gray-500">Количество мест</div>
                      <div className="font-medium">{order.place_number}</div>
                    </div>
                  </div>
                </div>
                
                {order.description && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Описание</div>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm">{order.description}</div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Participants Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <User className="h-5 w-5" />
                  Участники заказа
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="font-medium text-blue-800 mb-3">Продавец</div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Имя:</span> {order.order_seller_name}
                      </div>
                      {isAuthorized && (
                        <div>
                          <span className="text-gray-500">OPT ID:</span> {order.seller?.opt_id || order.seller_opt_id || 'Не указан'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-medium text-green-800 mb-3">Покупатель</div>
                    <div className="space-y-2 text-sm">
                      {isAuthorized ? (
                        <>
                          <div>
                            <span className="text-gray-500">OPT ID:</span> {order.buyer_opt_id || 'Не указан'}
                          </div>
                          {order.telegram_url_order && (
                            <div>
                              <span className="text-gray-500">Telegram:</span>{' '}
                              <a 
                                href={`https://t.me/${order.telegram_url_order.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {order.telegram_url_order}
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-500">Требуется авторизация</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Delivery Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                  <Truck className="h-5 w-5" />
                  Доставка
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="font-medium text-yellow-800 mb-2">Способ доставки</div>
                  <div className="text-sm">{getDeliveryMethodLabel(order.delivery_method)}</div>
                  
                  {order.container_number && (
                    <div className="mt-4 space-y-2">
                      <div className="font-medium text-yellow-800">Контейнер OPTCargo</div>
                      <div className="text-sm">
                        <span className="text-gray-500">Номер:</span> {order.container_number}
                      </div>
                      {order.container_status && (
                        <div className="text-sm">
                          <span className="text-gray-500">Статус:</span>{' '}
                          <Badge variant="secondary" className="text-xs">
                            {order.container_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Media Section */}
              {(allImages.length > 0 || allVideos.length > 0) && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
                      <Camera className="h-5 w-5" />
                      Медиафайлы
                    </div>
                    
                    {/* Images */}
                    {allImages.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 mb-3">Фотографии ({allImages.length})</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {allImages.map((imageUrl, index) => (
                            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={imageUrl} 
                                alt={`Order image ${index + 1}`}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                  className="text-xs"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Videos */}
                    {allVideos.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 mb-3">Видео ({allVideos.length})</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {allVideos.map((videoUrl, index) => (
                            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-black">
                              <video 
                                src={videoUrl}
                                controls
                                className="w-full h-full object-contain"
                                preload="metadata"
                              />
                              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                Видео {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin Confirmation Images Dialog */}
        {isAdmin && (
          <Dialog open={showConfirmImages} onOpenChange={setShowConfirmImages}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Подтверждающие фотографии - Заказ № {order.order_number}</DialogTitle>
              </DialogHeader>
              <OrderConfirmationImages 
                orderId={order.id} 
                canEdit={true}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetails;
