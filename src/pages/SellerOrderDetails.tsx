import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, User, DollarSign, MapPin, Truck, Clock, Camera, Film, Download, Calendar, Star, MessageCircle, MessageSquare, CheckCircle2, AlertCircle, Loader2, ExternalLink, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import SellerLayout from "@/components/layout/SellerLayout";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerOrderDetailsTranslations } from '@/utils/translations/sellerOrderDetails';
import { getCommonTranslations } from '@/utils/translations/common';
import { OrderConfirmButton } from '@/components/order/OrderConfirmButton';
import { OrderConfirmEvidenceWizard } from "@/components/admin/OrderConfirmEvidenceWizard";
import { useMobileLayout } from '@/hooks/useMobileLayout';

const SellerOrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const { language } = useLanguage();
  const t = getSellerOrderDetailsTranslations(language);
  const c = getCommonTranslations(language);
  const { isMobile } = useMobileLayout();
  const [showConfirmationUpload, setShowConfirmationUpload] = useState(false);

  // Main order query with buyer/seller info and product data
  const { data: order, isLoading: isOrderLoading, error: orderError } = useQuery({
    queryKey: ['seller-order', id],
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
          ),
          source_product:product_id(
            id,
            lot_number,
            title,
            brand,
            model,
            price,
            status
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Check if seller can access this order
      if (data.seller_id !== user?.id && profile?.user_type !== 'admin') {
        throw new Error('Access denied: You can only view your own orders');
      }
      
      return data;
    },
    enabled: !!id && !isAuthLoading && !!user
  });

  // Images query
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
    enabled: !!id && !!order
  });

  // Videos query
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
    enabled: !!id && !!order
  });

  // Confirmation images queries
  const { data: chatScreenshots = [] } = useQuery({
    queryKey: ['confirm-images', id, 'chat_screenshot'],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', id)
        .eq('category', 'chat_screenshot');

      if (error) throw error;
      return data?.map(img => img.url) || [];
    },
    enabled: !!id && !!order
  });

  const { data: signedProductPhotos = [] } = useQuery({
    queryKey: ['confirm-images', id, 'signed_product'],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', id)
        .eq('category', 'signed_product');

      if (error) throw error;
      return data?.map(img => img.url) || [];
    },
    enabled: !!id && !!order
  });

  if (!id) {
    return (
      <SellerLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">{t.error}</h1>
            <p className="text-gray-600 mt-2">{t.orderNotFound}</p>
          </div>
        </div>
      </SellerLayout>
    );
  }

  // Show loading while auth is loading or main order is loading
  if (isAuthLoading || isOrderLoading) {
    return (
      <SellerLayout>
        <div className="container mx-auto py-8 flex justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">
              {isAuthLoading ? t.checkingAccess : t.loadingOrder}
            </span>
          </div>
        </div>
      </SellerLayout>
    );
  }

  if (orderError || !order) {
    return (
      <SellerLayout>
        <div className="container mx-auto py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="text-destructive text-lg font-medium mb-2">
                {t.orderNotFound}
              </div>
              <p className="text-muted-foreground">
                {orderError?.message || t.errorLoadingOrder}
              </p>
            </CardContent>
          </Card>
        </div>
      </SellerLayout>
    );
  }

  const isSelfOrder = order.seller_id === order.buyer_id;
  const allVideos = [...(order.video_url || []), ...videos];
  const allImages = [...(order.images || []), ...images];

  const handleConfirmationUploadComplete = () => {
    setShowConfirmationUpload(false);
  };

  const handleConfirmationUploadSkip = () => {
    setShowConfirmationUpload(false);
  };

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
    return t.statuses[status] || status;
  };

  const getDeliveryMethodLabel = (method: string) => {
    return t.shippingMethods[method] || method;
  };

  const getContainerTypeLabel = (type: string) => {
    return t.containerTypes[type] || type;
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
    return t.containerStatuses[status] || status;
  };

  const getOrderTypeLabel = (type: string) => {
    return t.orderTypes[type] || type;
  };

  const getOrderTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'product_order': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'free_order': return 'bg-green-50 text-green-700 border-green-200';
      case 'ads_order': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <SellerLayout>
      <div className="container mx-auto py-8 max-w-5xl">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/seller/orders")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.buttons.back}
          </Button>
        </div>

        {/* OPT ID and Order Number Blocks */}
        <div className={`mb-8 grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {/* OPT ID Block */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-blue-700/10 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">{t.optId}</div>
                  <div className="text-2xl font-bold text-foreground">
                    {order.buyer_opt_id || t.notSpecified}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Order Number Block */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/15 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground font-medium">{t.orderNumber}</div>
                  <div className="text-2xl font-bold text-foreground">
                    № {order.order_number}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Header Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-4xl font-bold text-foreground">№ {order.order_number}</h1>
                  <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm font-medium border`}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  <Badge className={`${getOrderTypeBadgeColor(order.order_created_type)} px-3 py-1 text-sm font-medium border`}>
                    <Box className="h-3 w-3 mr-1" />
                    {getOrderTypeLabel(order.order_created_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      {t.createdAt} {new Date(order.created_at).toLocaleDateString('ru-RU', {
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
                      {t.selfOrder}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {['seller_confirmed', 'admin_confirmed', 'processed', 'shipped', 'delivered'].includes(order.status) && (
                  <OrderConfirmButton orderId={order.id} />
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
                  <h2 className="text-xl font-semibold">{t.productInformation}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.productName}</div>
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
                    {/* Show lot number for product orders */}
                    {order.order_created_type === 'product_order' && order.source_product?.lot_number && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{t.lotNumber}</div>
                        <div className="font-medium flex items-center gap-2">
                          <span className="font-mono text-lg">№ {order.source_product.lot_number}</span>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Box className="h-3 w-3 mr-1" />
                            {t.sourceProduct}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.totalPrice}</div>
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
                      <div className="text-sm text-muted-foreground mb-1">{t.placesCount}</div>
                      <div className="font-medium">{order.place_number}</div>
                    </div>
                  </div>
                </div>
                
                {/* Source Product Info for product orders */}
                {order.order_created_type === 'product_order' && order.source_product && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-blue-600 font-medium mb-1">{t.originalProduct}</div>
                          <div className="text-lg font-medium">{order.source_product.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.source_product.brand} {order.source_product.model && `• ${order.source_product.model}`}
                            {order.source_product.lot_number && ` • ${t.lotNumber}: №${order.source_product.lot_number}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">{t.totalPrice}</div>
                          <div className="text-xl font-bold text-blue-600">${order.source_product.price}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {order.description && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="text-sm text-muted-foreground mb-2">{t.description}</div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{order.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media Files */}
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
                              className="w-full h-full object-contain transition-transform group-hover:scale-105"
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

                  {allVideos.length > 0 && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <Film className="h-4 w-4" />
                        {t.videos} ({allVideos.length})
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allVideos.map((videoUrl, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden bg-muted border">
                            <video 
                              src={videoUrl} 
                              className="w-full h-auto max-h-64 object-cover"
                              controls
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Buyer Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{t.buyerInformation}</h2>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{t.buyerName}</div>
                    <div className="font-medium">{order.buyer?.full_name || t.notSpecified}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{t.buyerOptId}</div>
                    <div className="font-medium font-mono">{order.buyer?.opt_id || order.buyer_opt_id || t.notSpecified}</div>
                  </div>
                  
                </div>
              </CardContent>
            </Card>

            {/* Delivery Information */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{t.deliveryInformation}</h2>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">{t.deliveryMethod}</div>
                    <Badge variant="outline" className="text-sm">
                      {getDeliveryMethodLabel(order.delivery_method)}
                    </Badge>
                  </div>
                  
                  {order.container_number && (
                    <>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">{t.containerNumber}</div>
                        <div className="font-medium font-mono">{order.container_number}</div>
                      </div>
                      
                      {order.container?.status && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">{t.containerStatus}</div>
                          <Badge className={`${getContainerStatusColor(order.container.status)} text-xs`}>
                            {getContainerStatusLabel(order.container.status)}
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Images Upload Dialog */}
      <OrderConfirmEvidenceWizard
        open={showConfirmationUpload}
        orderId={order.id}
        onComplete={handleConfirmationUploadComplete}
        onCancel={handleConfirmationUploadSkip}
      />
    </SellerLayout>
  );
};

export default SellerOrderDetails;