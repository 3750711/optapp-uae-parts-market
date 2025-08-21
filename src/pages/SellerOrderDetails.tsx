
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import SellerLayout from '@/components/layout/SellerLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, User, Package, DollarSign, MapPin, Truck, Clock, Camera, Download, Calendar, Star, MessageCircle } from 'lucide-react';
import { OrderConfirmImagesDialog } from '@/components/order/OrderConfirmImagesDialog';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';


const SellerOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();

  // Translation system based on user type
  const isSeller = profile?.user_type === 'seller';
  
  const t = {
    loading: isSeller ? 'Loading order...' : 'Загрузка заказа...',
    orderNotFound: isSeller ? 'Order not found' : 'Заказ не найден',
    orderNotFoundDesc: isSeller ? 'The order with the specified ID does not exist or you do not have permission to view it.' : 'Заказ с указанным ID не существует или у вас нет прав для его просмотра.',
    accessDenied: isSeller ? 'Access denied' : 'Доступ запрещен',
    accessDeniedDesc: isSeller ? 'You do not have permission to view this order.' : 'У вас нет прав для просмотра этого заказа.',
    created: isSeller ? 'Created' : 'Создан',
    selfOrder: isSeller ? 'Self-order' : 'Самозаказ',
    confirmPhotos: isSeller ? 'Conf. Photos' : 'Подтв. фото',
    productInfo: isSeller ? 'Product Information' : 'Информация о товаре',
    name: isSeller ? 'Name' : 'Наименование',
    brand: isSeller ? 'Brand' : 'Бренд',
    model: isSeller ? 'Model' : 'Модель',
    productPrice: isSeller ? 'Product Price' : 'Цена товара',
    deliveryCost: isSeller ? 'Delivery Cost' : 'Стоимость доставки',
    numberOfPlaces: isSeller ? 'Number of Places' : 'Количество мест',
    additionalInfo: isSeller ? 'Additional Information' : 'Дополнительная информация',
    mediaFiles: isSeller ? 'Media Files' : 'Медиафайлы',
    photos: isSeller ? 'Photos' : 'Фотографии',
    files: isSeller ? 'files' : 'файлов',
    open: isSeller ? 'Open' : 'Открыть',
    participants: isSeller ? 'Participants' : 'Участники',
    seller: isSeller ? 'Seller' : 'Продавец',
    buyer: isSeller ? 'Buyer' : 'Покупатель',
    buyerOptId: isSeller ? 'Buyer OPT ID' : 'OPT ID покупателя',
    delivery: isSeller ? 'Delivery' : 'Доставка',
    deliveryMethod: isSeller ? 'Delivery Method' : 'Способ доставки',
    containerNumber: isSeller ? 'Container Number' : 'Номер контейнера',
    containerStatus: isSeller ? 'Container Status' : 'Статус контейнера',
    confirmationPhotos: isSeller ? 'Confirmation Photos' : 'Подтверждающие фотографии',
    notSpecified: isSeller ? 'Not specified' : 'Не указан',
    labelInstruction: isSeller ? 'Label the product and add photos to the order' : 'Подпишите товар и добавьте фото в заказ'
  };

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Order ID is required');
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:buyer_id(telegram, full_name, opt_id, email, phone),
          seller:seller_id(telegram, full_name, opt_id, email, phone),
          container:containers!container_number (
            status
          )
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
      if (!user || !order || order.seller_id !== user.id) return [];
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', id);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    },
    enabled: !!id && !!user && !!order
  });

  const LayoutComponent = isSeller ? SellerLayout : Layout;

  if (isLoading) {
    return (
      <LayoutComponent>
        <div className="container mx-auto py-8 flex justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">{t.loading}</span>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  if (error || !order) {
    return (
      <LayoutComponent>
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="text-destructive text-lg font-medium mb-2">
                {t.orderNotFound}
              </div>
              <p className="text-muted-foreground">
                {t.orderNotFoundDesc}
              </p>
            </CardContent>
          </Card>
        </div>
      </LayoutComponent>
    );
  }

  // Проверяем, что пользователь имеет право просматривать этот заказ
  const canViewOrder = user && (order.seller_id === user.id || order.buyer_id === user.id);
  if (!canViewOrder) {
    return (
      <LayoutComponent>
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="text-destructive text-lg font-medium mb-2">
                {t.accessDenied}
              </div>
              <p className="text-muted-foreground">
                {t.accessDeniedDesc}
              </p>
            </CardContent>
          </Card>
        </div>
      </LayoutComponent>
    );
  }

  const isOrderSeller = order.seller_id === user?.id;
  const isSelfOrder = order.seller_id === order.buyer_id;
  
  // Функция для дедупликации массива по значению
  const deduplicateArray = (arr: string[]) => [...new Set(arr)];
  
  // Объединяем видео из поля video_url и из таблицы order_videos с дедупликацией
  const allVideos = deduplicateArray([...videos, ...(order.video_url || [])]);
  const allImages = deduplicateArray([...images, ...(order.images || [])]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'seller_confirmed': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'admin_confirmed': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'processed': return 'bg-green-50 text-green-700 border-green-200';
      case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (isSeller) {
      switch (status) {
        case 'created': return 'Created';
        case 'seller_confirmed': return 'Seller Confirmed';
        case 'admin_confirmed': return 'Admin Confirmed';
        case 'processed': return 'Processing';
        case 'shipped': return 'Shipped';
        case 'delivered': return 'Delivered';
        case 'cancelled': return 'Cancelled';
        default: return status;
      }
    } else {
      switch (status) {
        case 'created': return 'Создан';
        case 'seller_confirmed': return 'Подтвержден продавцом';
        case 'admin_confirmed': return 'Подтвержден администратором';
        case 'processed': return 'Обрабатывается';
        case 'shipped': return 'Отправлен';
        case 'delivered': return 'Доставлен';
        case 'cancelled': return 'Отменен';
        default: return status;
      }
    }
  };

  const getDeliveryMethodLabel = (method: string) => {
    if (isSeller) {
      switch (method) {
        case 'self_pickup': return 'Self Pickup';
        case 'cargo_rf': return 'Cargo RF';
        case 'cargo_kz': return 'Cargo KZ';
        default: return method;
      }
    } else {
      switch (method) {
        case 'self_pickup': return 'Самовывоз';
        case 'cargo_rf': return 'Cargo РФ';
        case 'cargo_kz': return 'Cargo KZ';
        default: return method;
      }
    }
  };

  const getContainerStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'in_transit': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'customs': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getContainerStatusLabel = (status: string) => {
    if (isSeller) {
      switch (status) {
        case 'waiting': return 'Waiting';
        case 'in_transit': return 'In Transit';
        case 'delivered': return 'Delivered';
        case 'customs': return 'At Customs';
        default: return status;
      }
    } else {
      switch (status) {
        case 'waiting': return 'Ожидание';
        case 'in_transit': return 'В пути';
        case 'delivered': return 'Доставлен';
        case 'customs': return 'На таможне';
        default: return status;
      }
    }
  };

  return (
    <LayoutComponent>
      <div className="container mx-auto py-8 max-w-5xl">
        {/* Header Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="bg-white rounded-lg p-4 border-2 border-primary/20 shadow-sm">
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Order Number</div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-foreground">№ {order.order_number}</h1>
                  </div>
                  {isSeller && order.buyer_opt_id && (
                    <div className="bg-white rounded-lg p-4 border-2 border-green-200 shadow-sm">
                      <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{t.buyerOptId}</div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-700 font-mono">{order.buyer_opt_id}</div>
                    </div>
                  )}
                  <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm font-medium border`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                
                {/* Product Labeling Instruction for Sellers */}
                {isSeller && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-800 font-medium text-sm">
                      {t.labelInstruction}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {t.created} {new Date(order.created_at).toLocaleDateString(isSeller ? 'en-US' : 'ru-RU', {
                        day: '2-digit',
                        month: isSeller ? 'short' : 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {isSelfOrder && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Star className="h-3 w-3 mr-1" />
                      {t.selfOrder}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isOrderSeller && (
                  <OrderConfirmImagesDialog orderId={order.id} />
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{t.productInfo}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.name}</div>
                      <div className="font-medium text-lg">{order.title}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.brand}</div>
                      <div className="font-medium">{order.brand || t.notSpecified}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.model}</div>
                      <div className="font-medium">{order.model || t.notSpecified}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.productPrice}</div>
                      <div className="font-bold text-2xl text-green-600 flex items-center gap-1">
                        <DollarSign className="h-5 w-5" />
                        {order.price}
                      </div>
                    </div>
                    {order.delivery_price_confirm && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{t.deliveryCost}</div>
                        <div className="font-semibold text-lg text-green-600 flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          ${order.delivery_price_confirm}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.numberOfPlaces}</div>
                      <div className="font-medium">{order.place_number}</div>
                    </div>
                  </div>
                </div>
                
                {order.text_order && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground mb-2">{t.additionalInfo}</div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{order.text_order}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media Section */}
            {(allImages.length > 0 || allVideos.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Camera className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">{t.mediaFiles}</h2>
                    <Badge variant="outline" className="ml-2">
                      {allImages.length + allVideos.length} {t.files}
                    </Badge>
                  </div>
                  
                  {/* Images */}
                  {allImages.length > 0 && (
                    <div className="mb-6">
                      <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        {t.photos} ({allImages.length})
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {allImages.map((imageUrl, index) => (
                          <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted border">
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
                                  className="text-xs shadow-lg"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  {t.open}
                                </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos - используем OptimizedOrderVideos компонент */}
                  {allVideos.length > 0 && (
                    <div>
                      <OptimizedOrderVideos 
                        videos={allVideos}
                        orderNumber={order.order_number?.toString()}
                      />
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
                  <h2 className="text-lg font-semibold">{t.participants}</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Seller */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-blue-800">{t.seller}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{isSeller ? 'Name:' : 'Имя:'}</span>
                        <span className="ml-2 font-medium">{order.order_seller_name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">OPT ID:</span>
                        <span className="ml-2 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                          {order.seller?.opt_id || order.seller_opt_id || t.notSpecified}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Buyer */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-green-800">{t.buyer}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">OPT ID:</span>
                        <span className="ml-2 font-mono text-lg bg-green-100 px-3 py-2 rounded font-bold text-green-700">
                          {order.buyer_opt_id || t.notSpecified}
                        </span>
                      </div>
                      {order.telegram_url_order && (
                        <div>
                          <span className="text-muted-foreground">Telegram:</span>
                          <a 
                            href={`https://t.me/${order.telegram_url_order.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <MessageCircle className="h-3 w-3" />
                            {order.telegram_url_order}
                          </a>
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
                  <h2 className="text-lg font-semibold">{t.delivery}</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="font-medium text-yellow-800 mb-2">{t.deliveryMethod}</div>
                    <div className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-yellow-600" />
                      {getDeliveryMethodLabel(order.delivery_method)}
                    </div>
                  </div>
                  
                  {/* Container Information */}
                  {order.container_number && (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded text-white text-sm font-bold">
                          OPTCargo
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">{t.containerNumber}</div>
                          <div className="font-mono text-lg font-semibold text-yellow-800 bg-yellow-100 px-3 py-1 rounded">
                            {order.container_number}
                          </div>
                        </div>
                        
                        {order.container?.status && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">{t.containerStatus}</div>
                            <Badge className={`${getContainerStatusColor(order.container.status)} border`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {getContainerStatusLabel(order.container.status)}
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
    </LayoutComponent>
  );
};

export default SellerOrderDetails;
