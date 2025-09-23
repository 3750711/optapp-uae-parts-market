import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { OrderConfirmButton } from "@/components/order/OrderConfirmButton";
import { PhotoConfirmationStatus } from "@/components/order/PhotoConfirmationStatus";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import OrderPriceConfirmDialog from "@/components/order/OrderPriceConfirmDialog";

import { OrderConfirmImagesDialog } from '@/components/order/OrderConfirmImagesDialog';
import { OrderImageThumbnail } from '@/components/order/OrderImageThumbnail';
import OrdersSearchBar from '@/components/orders/OrdersSearchBar';
import { useSellerOrdersQuery } from '@/hooks/useSellerOrdersQuery';
import { getSellerOrdersTranslations } from '@/utils/translations/sellerOrders';
import { useLanguage } from '@/hooks/useLanguage';

type OrderStatus = "created" | "seller_confirmed" | "admin_confirmed" | "processed" | "shipped" | "delivered" | "cancelled";

const SellerOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const t = getSellerOrdersTranslations(language);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  
  // Search state  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');


  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useSellerOrdersQuery({
    sellerId: user?.id,
    searchTerm: activeSearchTerm,
    pageSize: 20
  });

  // Flatten the paginated data and add confirmation images
  const ordersData = data?.pages.flatMap(page => page.data) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;
  
  const { data: orders, isLoading: isLoadingEnrichedOrders } = useQuery({
    queryKey: ['seller-orders-with-confirmations', ordersData.map(o => o.id)],
    queryFn: async () => {
      console.log('🔍 Enriching orders data with photo status for orders:', ordersData.map(o => o.order_number));
      
      if (!ordersData.length) return [];
      
      const ordersWithConfirmations = await Promise.all(ordersData.map(async (order) => {
        console.log(`📊 Processing order ${order.order_number} (${order.id})`);
        
        // Отдельные запросы для каждой категории, как в OrderConfirmButton
        const { data: chatScreenshots } = await supabase
          .from('confirm_images')
          .select('url')
          .eq('order_id', order.id)
          .eq('category', 'chat_screenshot');

        const { data: signedProductPhotos } = await supabase
          .from('confirm_images')
          .select('url')
          .eq('order_id', order.id)
          .eq('category', 'signed_product');
        
        const hasChatScreenshots = (chatScreenshots?.length || 0) > 0;
        const hasSignedProduct = (signedProductPhotos?.length || 0) > 0;
        
        console.log(`📷 Order ${order.order_number}: screenshots=${hasChatScreenshots} (${chatScreenshots?.length || 0}), photos=${hasSignedProduct} (${signedProductPhotos?.length || 0})`);
        
        // Также получаем общее количество изображений для обратной совместимости
        const { data: allConfirmImages } = await supabase
          .from('confirm_images')
          .select('url')
          .eq('order_id', order.id);
        
        return {
          ...order,
          hasConfirmImages: allConfirmImages && allConfirmImages.length > 0,
          hasChatScreenshots,
          hasSignedProduct
        };
      }));
      
      console.log('✅ Enrichment complete for', ordersWithConfirmations.length, 'orders');
      return ordersWithConfirmations;
    },
    enabled: ordersData.length > 0
  });

  const confirmOrderMutation = useMutation({
    mutationFn: async ({ orderId, newPrice }: { orderId: string; newPrice: number }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'seller_confirmed' as OrderStatus,
          price: newPrice
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error("Error updating order status:", error);
        throw error;
      }
      
      console.log("Updated order status:", data);
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['seller-orders', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((order: any) => {
          if (order.id === updatedOrder.id) {
            return {
              ...order,
              status: updatedOrder.status,
              price: updatedOrder.price
            };
          }
          return order;
        });
      });
      
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      
      toast({
        title: t.orderConfirmed,
        description: t.orderConfirmedDescription,
      });

      setIsPriceDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error) => {
      console.error('Error confirming order:', error);
      toast({
        title: t.error,
        description: t.confirmOrderError,
        variant: "destructive",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' as OrderStatus })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error("Error cancelling order:", error);
        throw error;
      }
      
      console.log("Cancelled order:", data);
      return data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['seller-orders', user?.id], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((order: any) => {
          if (order.id === updatedOrder.id) {
            return {
              ...order,
              status: updatedOrder.status
            };
          }
          return order;
        });
      });
      
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      
      toast({
        title: t.orderCancelled,
        description: t.orderCancelledDescription,
      });
    },
    onError: (error) => {
      console.error('Error cancelling order:', error);
      toast({
        title: t.error,
        description: t.cancelOrderError,
        variant: "destructive",
      });
    },
  });

  // Search handlers
  const handleSearch = () => {
    setActiveSearchTerm(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearchTerm('');
  };

  const handleConfirmOrder = (orderId: string, currentPrice: number) => {
    const numericPrice = typeof currentPrice === 'number' ? currentPrice : parseFloat(String(currentPrice));
    console.log("Opening price dialog with price:", numericPrice);
    setSelectedOrder({ 
      id: orderId, 
      price: numericPrice 
    });
    setIsPriceDialogOpen(true);
  };

  const getCardHighlightColor = (status: string) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-50';
      case 'seller_confirmed':
        return 'bg-blue-50';
      case 'admin_confirmed':
        return 'bg-green-50';
      case 'processed':
        return 'bg-[#F2FCE2] border-green-200 border-2 shadow-md';
      case 'created':
        return 'bg-yellow-50 animate-pulse-soft border-2 border-yellow-200 shadow-md';
      default:
        return '';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'created':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'seller_confirmed':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'admin_confirmed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'processed':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'shipped':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created':
        return t.statusLabels.created;
      case 'seller_confirmed':
        return t.statusLabels.seller_confirmed;
      case 'admin_confirmed':
        return t.statusLabels.admin_confirmed;
      case 'processed':
        return t.statusLabels.processed;
      case 'shipped':
        return t.statusLabels.shipped;
      case 'delivered':
        return t.statusLabels.delivered;
      case 'cancelled':
        return t.statusLabels.cancelled;
      default:
        return status;
    }
  };

  const getOrderTypeLabel = (type: 'free_order' | 'ads_order') => {
    return type === 'free_order' ? t.orderTypes.free_order : t.orderTypes.ads_order;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/seller/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToDashboard}
            </Button>
          </div>
          <div className="flex justify-center items-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/seller/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToDashboard}
            </Button>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t.pageTitle}</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {t.pageDescription}
            </p>
          </div>

          <OrdersSearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onClear={handleClearSearch}
            placeholder={t.searchPlaceholder}
            clearSearchTitle={t.clearSearch}
          />

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleSearch}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.searchingButton}
                  </>
                ) : (
                  t.findButton
                )}
              </Button>
              {activeSearchTerm && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {t.searchResultsFor} <strong>"{activeSearchTerm}"</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSearch}
                  >
                    {t.clearButton}
                  </Button>
                </div>
              )}
            </div>
            
            {!activeSearchTerm && totalCount > 0 && (
              <div className="text-sm text-muted-foreground">
                {t.totalOrders} <strong>{totalCount}</strong>
              </div>
            )}
            
            {activeSearchTerm && (orders || ordersData).length > 0 && (
              <div className="text-sm text-muted-foreground">
                {t.foundResults} <strong>{(orders || ordersData).length}</strong> of {totalCount}
              </div>
            )}
          </div>
          
          <Separator />

          {/* Use enriched orders if available, otherwise fallback to original data */}
          {(orders || ordersData).length > 0 ? (
            <>
              {isLoadingEnrichedOrders && !orders && (
                <div className="text-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Loading photo status...
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(orders || ordersData).map((order) => (
                <Card 
                  key={order.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${getCardHighlightColor(order.status)}`}
                  onClick={() => navigate(`/seller/orders/${order.id}`)}
                >
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      {order.hasConfirmImages && (
                        <div 
                          className="flex items-center gap-2 text-green-600 text-sm cursor-pointer hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <OrderConfirmImagesDialog orderId={order.id} />
                        </div>
                      )}
                      <Badge className={getStatusBadgeColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </div>
                    
                    <PhotoConfirmationStatus 
                      hasChatScreenshots={order.hasChatScreenshots || false}
                      hasSignedProduct={order.hasSignedProduct || false}
                      className="pb-1"
                    />
                    
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold">№ {order.order_number}</CardTitle>
                      {order.lot_number_order && (
                        <div className="text-sm text-muted-foreground">
                          {t.lot} {order.lot_number_order}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <OrderImageThumbnail 
                        orderId={order.id} 
                        size="card" 
                        className="w-16 h-16 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="font-medium">{order.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.brand} {order.model}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="font-medium text-lg">{order.price} $</div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                       <span className="font-medium">{t.shippingPlaces}:</span>
                        <span>{order.place_number || 1}</span>
                      </div>
                    </div>

                    {order.delivery_price_confirm && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">{t.deliveryCost}:</span>
                        <span>{order.delivery_price_confirm} $</span>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">{t.buyer}</div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="font-mono">
                          {order.buyer_opt_id || t.notSpecified}
                        </Badge>
                      </div>
                    </div>

                    {order.text_order && order.text_order.trim() !== "" && (
                      <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                        <span className="font-medium">{t.additionalInformation}</span>
                        <p className="mt-1 whitespace-pre-wrap line-clamp-3">{order.text_order}</p>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <Badge variant="outline">
                        {getOrderTypeLabel(order.order_created_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString(
                          language === 'ru' ? 'ru-RU' : language === 'bn' ? 'bn-BD' : 'en-US'
                        )}
                      </span>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      {order.status === 'created' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmOrder(order.id, order.price || 0);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {t.confirmButton}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <X className="h-4 w-4 mr-2" />
                                {t.cancelButton}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t.cancelOrderTitle}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t.cancelOrderDescription}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                  {t.cancel}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelOrderMutation.mutate(order.id);
                                  }}
                                >
                                  {t.confirm}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      
                      {order.status === 'admin_confirmed' && (
                        <div className="w-full pt-2" onClick={(e) => e.stopPropagation()}>
                          <OrderConfirmButton orderId={order.id} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
              
              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="px-8"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t.loading}
                      </>
                    ) : (
                      t.loadMore
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center p-4 md:p-8 text-muted-foreground">
              {activeSearchTerm ? (
                <>
                  <p className="mb-4">{t.noResultsFound} "{activeSearchTerm}"</p>
                  <Button
                    variant="outline"
                    onClick={handleClearSearch}
                  >
                    {t.clearSearch}
                  </Button>
                </>
              ) : (
                <p>{t.noOrders}</p>
              )}
            </div>
          )}
        </div>
      </div>
      <OrderPriceConfirmDialog
        open={isPriceDialogOpen}
        onOpenChange={setIsPriceDialogOpen}
        currentPrice={selectedOrder?.price || 0}
        onConfirm={(newPrice) => {
          if (selectedOrder) {
            console.log("Confirming order with new price:", newPrice);
            confirmOrderMutation.mutate({ 
              orderId: selectedOrder.id, 
              newPrice 
            });
          }
        }}
        isSubmitting={confirmOrderMutation.isPending}
      />
    </div>
  );
};

export default SellerOrders;
