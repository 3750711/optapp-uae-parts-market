import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, User, Package, DollarSign, MapPin, Truck, Clock, Camera, Film, Download, Calendar, Star, MessageCircle, MessageSquare, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { OrderConfirmImagesDialog } from '@/components/order/OrderConfirmImagesDialog';
import { OrderTelegramMedia } from '@/components/order/OrderTelegramMedia';

const AdminOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  

  // Log AuthContext state for debugging
  React.useEffect(() => {
    console.log('AdminOrderDetails AuthContext state:', {
      user: !!user,
      profile: !!profile,
      profileUserType: profile?.user_type,
      isAuthLoading,
      userId: user?.id
    });
  }, [user, profile, isAuthLoading]);

  // Main order query - independent of profile loading
      const { data: order, isLoading: isOrderLoading, error: orderError } = useQuery({
        queryKey: ['admin-order', id],
        queryFn: async () => {
          console.log('Fetching order data for ID:', id);
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

          if (error) {
            console.error('Order fetch error:', error);
            throw error;
          }
          
          console.log('Order data fetched:', data);
          return data;
        },
        enabled: !!id
      });

  // Images query - independent of profile
  const { data: images = [] } = useQuery({
    queryKey: ['order-images', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('order_images')
        .select('url')
        .eq('order_id', id);

      if (error) {
        console.error('Images fetch error:', error);
        throw error;
      }
      return data?.map(img => img.url) || [];
    },
    enabled: !!id
  });

  // Videos query - independent of profile
  const { data: videos = [] } = useQuery({
    queryKey: ['order-videos', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('order_videos')
        .select('url')
        .eq('order_id', id);

      if (error) {
        console.error('Videos fetch error:', error);
        throw error;
      }
      return data?.map(video => video.url) || [];
    },
    enabled: !!id
  });

  // Chat screenshots query
  const { data: chatScreenshots = [] } = useQuery({
    queryKey: ['confirm-images', id, 'chat_screenshot'],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', id)
        .eq('category', 'chat_screenshot');

      if (error) {
        console.error('Chat screenshots fetch error:', error);
        throw error;
      }
      return data?.map(img => img.url) || [];
    },
    enabled: !!id && !isAuthLoading && profile?.user_type === 'admin'
  });

  // Signed product photos query
  const { data: signedProductPhotos = [] } = useQuery({
    queryKey: ['confirm-images', id, 'signed_product'],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', id)
        .eq('category', 'signed_product');

      if (error) {
        console.error('Signed product photos fetch error:', error);
        throw error;
      }
      return data?.map(img => img.url) || [];
    },
    enabled: !!id && !isAuthLoading && profile?.user_type === 'admin'
  });

  if (!id) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Ошибка</h1>
            <p className="text-gray-600 mt-2">ID заказа не указан</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show loading while auth is loading or main order is loading
  if (isAuthLoading || isOrderLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8 flex justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">
              {isAuthLoading ? 'Проверка прав доступа...' : 'Загрузка заказа...'}
            </span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (orderError || !order) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="text-destructive text-lg font-medium mb-2">
                Заказ не найден
              </div>
              <p className="text-muted-foreground">
                Заказ с указанным ID не существует или у вас нет прав для его просмотра.
              </p>
              {orderError && (
                <p className="text-xs text-red-500 mt-2">
                  Ошибка: {orderError.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const isAdmin = profile?.user_type === 'admin';
  const isAuthorized = !!user;
  const isSelfOrder = order.seller_id === order.buyer_id;
  const allVideos = [...(order.video_url || []), ...videos];
  const allImages = [...(order.images || []), ...images];

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
  };

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup': return 'Самовывоз';
      case 'cargo_rf': return 'Cargo РФ';
      case 'cargo_kz': return 'Cargo KZ';
      default: return method;
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
    switch (status) {
      case 'waiting': return 'Ожидание';
      case 'in_transit': return 'В пути';
      case 'delivered': return 'Доставлен';
      case 'customs': return 'На таможне';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-8 max-w-5xl">
        {/* Header Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-bold text-foreground">№ {order.order_number}</h1>
                  <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm font-medium border`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Создан {new Date(order.created_at).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {isSelfOrder && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Star className="h-3 w-3 mr-1" />
                      Самозаказ
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowConfirmDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Подтверждающие фото
                      <div className="flex items-center gap-1 ml-2">
                        <div className="flex items-center gap-1">
                          <MessageSquare className={`h-3 w-3 ${chatScreenshots.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <Badge variant={chatScreenshots.length > 0 ? "default" : "secondary"} className="text-xs px-1 h-4">
                            {chatScreenshots.length}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className={`h-3 w-3 ${signedProductPhotos.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`} />
                          <Badge variant={signedProductPhotos.length > 0 ? "default" : "secondary"} className="text-xs px-1 h-4">
                            {signedProductPhotos.length}
                          </Badge>
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="flex items-center gap-2"
                    >
                      <a
                        href={`https://t.me/your_bot_username?start=order_${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Send className="h-4 w-4" />
                        📷 Загрузить из Telegram
                      </a>
                    </Button>
                    <OrderConfirmImagesDialog 
                      orderId={order.id} 
                      open={showConfirmDialog}
                      onOpenChange={setShowConfirmDialog}
                    />
                  </>
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
                  <h2 className="text-xl font-semibold">Информация о товаре</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Наименование</div>
                      <div className="font-medium text-lg">{order.title}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Бренд</div>
                      <div className="font-medium">{order.brand || 'Не указан'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Модель</div>
                      <div className="font-medium">{order.model || 'Не указана'}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Цена товара</div>
                      <div className="font-bold text-2xl text-green-600 flex items-center gap-1">
                        <DollarSign className="h-5 w-5" />
                        {order.price}
                      </div>
                    </div>
                    {order.delivery_price_confirm && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Стоимость доставки</div>
                        <div className="font-semibold text-lg text-green-600 flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          ${order.delivery_price_confirm}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Количество мест</div>
                      <div className="font-medium">{order.place_number}</div>
                    </div>
                  </div>
                </div>
                
                {order.description && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground mb-2">Описание</div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{order.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Telegram Media */}
            {isAdmin && (
              <OrderTelegramMedia orderId={order.id} />
            )}

            {(allImages.length > 0 || allVideos.length > 0) && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Camera className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Медиафайлы</h2>
                    <Badge variant="outline" className="ml-2">
                      {allImages.length + allVideos.length} файлов
                    </Badge>
                  </div>
                  
                  {allImages.length > 0 && (
                    <div className="mb-6">
                      <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Фотографии ({allImages.length})
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
                                Открыть
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {allVideos.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        Видео ({allVideos.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allVideos.map((videoUrl, index) => (
                          <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-black border">
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
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Участники</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="font-medium text-blue-800">Продавец</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Имя:</span>
                        <span className="ml-2 font-medium">{order.order_seller_name}</span>
                      </div>
                      {isAuthorized && (
                        <div>
                          <span className="text-muted-foreground">OPT ID:</span>
                          <span className="ml-2 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                            {order.seller?.opt_id || order.seller_opt_id || 'Не указан'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="font-medium text-green-800">Покупатель</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      {isAuthorized ? (
                        <>
                          <div>
                            <span className="text-muted-foreground">OPT ID:</span>
                            <span className="ml-2 font-mono text-xs bg-green-100 px-2 py-1 rounded">
                              {order.buyer_opt_id || 'Не указан'}
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
                        </>
                      ) : (
                        <div className="text-muted-foreground text-center py-2">
                          Требуется авторизация для просмотра контактов
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Доставка</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="font-medium text-yellow-800 mb-2">Способ доставки</div>
                    <div className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-yellow-600" />
                      {getDeliveryMethodLabel(order.delivery_method)}
                    </div>
                  </div>
                  
                  {order.container_number && (
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
                            {order.container_number}
                          </div>
                        </div>
                        
                        {order.container_number && (
                          <div>
                            <div className="text-sm text-muted-foreground mb-1">Статус контейнера</div>
                            <Badge className={`${getContainerStatusColor(order.container?.status)} border`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {getContainerStatusLabel(order.container?.status)}
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
    </AdminLayout>
  );
};

export default AdminOrderDetails;
