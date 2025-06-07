
import React from 'react';
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Database } from '@/integrations/supabase/types';
import { Loader2, Save, X } from "lucide-react";
import { OrderEditHeader } from "@/components/admin/order/OrderEditHeader";
import { OrderEditTabs } from "@/components/admin/order/OrderEditTabs";
import { useIsMobile } from '@/hooks/use-mobile';

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export interface AdminOrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
}

export const AdminOrderEditDialog: React.FC<AdminOrderEditDialogProps> = ({
  open,
  onOpenChange,
  order,
  onStatusChange
}) => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [orderImages, setOrderImages] = React.useState<string[]>([]);
  const [orderVideos, setOrderVideos] = React.useState<string[]>([]);
  const [orderVideosFromTable, setOrderVideosFromTable] = React.useState<string[]>([]);

  const form = useForm({
    defaultValues: {
      order_number: order?.order_number?.toString() || '',
      title: order?.title || '',
      brand: order?.brand || '',
      model: order?.model || '',
      price: order?.price?.toString() || '',
      place_number: order?.place_number?.toString() || '1',
      status: order?.status || 'created',
      description: order?.description || '',
      delivery_price_confirm: order?.delivery_price_confirm?.toString() || '',
      delivery_method: order?.delivery_method || 'self_pickup',
    }
  });

  // Load order images and videos when dialog opens
  React.useEffect(() => {
    if (order && open) {
      console.log('Dialog opened - forcing fresh data fetch for order:', order.id);
      
      // Force refresh all order-related queries when dialog opens
      queryClient.refetchQueries({ queryKey: ['admin-orders'] });
      queryClient.refetchQueries({ queryKey: ['admin-orders-optimized'] });
      queryClient.refetchQueries({ queryKey: ['order', order.id] });
      
      // Reset local state first
      setOrderImages([]);
      setOrderVideos([]);
      setOrderVideosFromTable([]);
      
      // Fetch fresh order data from database
      const loadFreshOrderData = async () => {
        try {
          console.log('Fetching fresh order data from database...');
          
          // Get fresh order data including both images and videos
          const { data: freshOrder, error: orderError } = await supabase
            .from('orders')
            .select('images, video_url')
            .eq('id', order.id)
            .single();

          if (orderError) throw orderError;

          const freshImages = freshOrder?.images || [];
          console.log('Fresh images from database:', freshImages);
          console.log('Cached images from prop:', order.images);
          
          setOrderImages(freshImages);

          // Get videos from video_url field in orders table
          const videosFromField = freshOrder?.video_url || [];
          console.log('Videos from video_url field:', videosFromField);
          
          // Get videos from order_videos table
          const { data: videosFromTable, error: videosError } = await supabase
            .from('order_videos')
            .select('url')
            .eq('order_id', order.id)
            .order('created_at', { ascending: true });

          if (videosError) {
            console.error('Error fetching videos from order_videos table:', videosError);
          }

          const videosFromTableUrls = videosFromTable?.map(v => v.url) || [];
          console.log('Videos from order_videos table:', videosFromTableUrls);
          
          // Combine all videos for display
          const allVideos = [...videosFromField, ...videosFromTableUrls];
          console.log('All videos combined:', allVideos);
          
          setOrderVideos(allVideos);
          setOrderVideosFromTable(videosFromTableUrls);
          
          // Update cache with fresh data
          queryClient.setQueryData(['order', order.id], (oldData: any) => {
            console.log('Updating cache with fresh order data');
            return oldData ? { 
              ...oldData, 
              images: freshImages, 
              video_url: videosFromField 
            } : oldData;
          });

        } catch (error) {
          console.error('Error loading fresh order data:', error);
        }
      };

      loadFreshOrderData();
    }
  }, [order, open, queryClient]);

  // Reset form when order changes
  React.useEffect(() => {
    if (order) {
      console.log('Resetting form with order data:', order);
      form.reset({
        order_number: order.order_number?.toString(),
        title: order.title,
        brand: order.brand,
        model: order.model,
        price: order.price?.toString(),
        place_number: order.place_number?.toString(),
        status: order.status,
        description: order.description || '',
        delivery_price_confirm: order.delivery_price_confirm?.toString() || '',
        delivery_method: order.delivery_method,
      });
    }
  }, [order, form]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;

      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        form.handleSubmit(onSubmit)();
      }
      
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, form, onOpenChange]);

  const handleImagesUpload = async (updatedUrls: string[]) => {
    if (!order?.id) return;

    try {
      console.log('Updating order images:', { orderId: order.id, urls: updatedUrls });
      
      // Update the images field in the orders table with the complete updated array
      const { error } = await supabase
        .from('orders')
        .update({ images: updatedUrls })
        .eq('id', order.id);

      if (error) throw error;

      // Optimistically update cache immediately
      queryClient.setQueryData(['admin-orders'], (oldData: any) => {
        if (!oldData) return oldData;
        
        if (oldData.pages) {
          console.log('Optimistically updating admin-orders cache (paginated)');
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data: page.data?.map((orderItem: any) => 
                orderItem.id === order.id 
                  ? { ...orderItem, images: updatedUrls }
                  : orderItem
              ) || []
            }))
          };
        } else if (oldData.data) {
          console.log('Optimistically updating admin-orders cache (regular)');
          return {
            ...oldData,
            data: oldData.data.map((orderItem: any) => 
              orderItem.id === order.id 
                ? { ...orderItem, images: updatedUrls }
                : orderItem
            )
          };
        }
        
        return oldData;
      });

      queryClient.setQueryData(['admin-orders-optimized'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        console.log('Optimistically updating admin-orders-optimized cache');
        return {
          ...oldData,
          data: oldData.data.map((orderItem: any) => 
            orderItem.id === order.id 
              ? { ...orderItem, images: updatedUrls }
              : orderItem
          )
        };
      });

      queryClient.setQueryData(['order', order.id], (oldData: any) => {
        console.log('Optimistically updating specific order cache');
        return oldData ? { ...oldData, images: updatedUrls } : oldData;
      });

      // Update local state
      setOrderImages(updatedUrls);

      // Calculate the difference for toast message
      const previousCount = orderImages.length;
      const newCount = updatedUrls.length;
      
      if (newCount > previousCount) {
        const addedCount = newCount - previousCount;
        toast({
          title: "Успешно",
          description: `Добавлено ${addedCount} фотографий`,
        });
      } else if (newCount < previousCount) {
        const removedCount = previousCount - newCount;
        toast({
          title: "Успешно",
          description: `Удалено ${removedCount} фотографий`,
        });
      }

      // Force refetch to ensure consistency
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
        queryClient.invalidateQueries({ queryKey: ['admin-orders-optimized'] });
        queryClient.invalidateQueries({ queryKey: ['order', order.id] });
        console.log('Forced cache invalidation after image update');
      }, 100);
      
    } catch (error) {
      console.error('Error updating order images:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить фотографии",
        variant: "destructive",
      });
    }
  };

  const handleVideoUpload = async (urls: string[]) => {
    if (!order?.id) return;

    try {
      console.log('Adding videos to order video_url field:', { orderId: order.id, urls });
      
      // Get current videos from video_url field (not from table)
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('video_url')
        .eq('id', order.id)
        .single();

      if (fetchError) throw fetchError;

      const currentVideosFromField = currentOrder?.video_url || [];
      const updatedVideos = [...currentVideosFromField, ...urls];
      
      // Update video_url field in orders table
      const { error } = await supabase
        .from('orders')
        .update({ video_url: updatedVideos })
        .eq('id', order.id);

      if (error) throw error;

      // Update local state with all videos
      const allVideos = [...updatedVideos, ...orderVideosFromTable];
      setOrderVideos(allVideos);

      toast({
        title: "Успешно",
        description: `Добавлено ${urls.length} видео`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    } catch (error) {
      console.error('Error uploading videos:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить видео",
        variant: "destructive",
      });
    }
  };

  const handleVideoDelete = async (url: string) => {
    if (!order?.id) return;

    try {
      console.log('Deleting video:', url);
      
      // Check if video is from order_videos table
      const isFromTable = orderVideosFromTable.includes(url);
      
      if (isFromTable) {
        // Delete from order_videos table
        const { error } = await supabase
          .from('order_videos')
          .delete()
          .eq('order_id', order.id)
          .eq('url', url);

        if (error) throw error;

        // Update local state
        const updatedVideosFromTable = orderVideosFromTable.filter(videoUrl => videoUrl !== url);
        setOrderVideosFromTable(updatedVideosFromTable);
        
        // Get current videos from video_url field
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('video_url')
          .eq('id', order.id)
          .single();
        
        const videosFromField = currentOrder?.video_url || [];
        const allVideos = [...videosFromField, ...updatedVideosFromTable];
        setOrderVideos(allVideos);
        
        console.log('Deleted video from order_videos table');
      } else {
        // Remove from video_url array in orders table
        const { data: currentOrder, error: fetchError } = await supabase
          .from('orders')
          .select('video_url')
          .eq('id', order.id)
          .single();

        if (fetchError) throw fetchError;

        const currentVideos = currentOrder?.video_url || [];
        const updatedVideos = currentVideos.filter(videoUrl => videoUrl !== url);
        
        const { error } = await supabase
          .from('orders')
          .update({ video_url: updatedVideos })
          .eq('id', order.id);

        if (error) throw error;

        // Update local state
        const allVideos = [...updatedVideos, ...orderVideosFromTable];
        setOrderVideos(allVideos);
        
        console.log('Deleted video from video_url field');
      }

      toast({
        title: "Успешно",
        description: "Видео удалено",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить видео",
        variant: "destructive",
      });
    }
  };

  const updateOrderMutation = useMutation({
    mutationFn: async (values: any) => {
      if (!order?.id) return null;

      // Check if order number has changed and validate uniqueness
      const newOrderNumber = Number(values.order_number);
      if (newOrderNumber !== order.order_number) {
        const { data: isUnique, error: checkError } = await supabase.rpc('check_order_number_unique', {
          p_order_number: newOrderNumber,
          p_order_id: order.id
        });

        if (checkError) throw checkError;
        if (!isUnique) {
          throw new Error('Номер заказа уже существует');
        }
      }

      // If onStatusChange is provided and the status has changed, use it
      const statusChanged = values.status !== order.status;
      if (statusChanged && onStatusChange) {
        await onStatusChange(order.id, values.status);
        return null; // Let the onStatusChange handle it
      } else {
        // Standard update without the special status change handler
        const { data, error } = await supabase
          .from('orders')
          .update({
            ...values,
            order_number: newOrderNumber,
            price: Number(values.price),
            quantity: Number(values.place_number),
            place_number: Number(values.place_number),
            delivery_price_confirm: values.delivery_price_confirm ? Number(values.delivery_price_confirm) : null,
          })
          .eq('id', order.id)
          .select()
          .single();

        if (error) throw error;

        // If status changed but no onStatusChange handler, send notification manually
        if (statusChanged) {
          try {
            // Get order images from the images field
            const images = orderImages || [];
            
            await supabase.functions.invoke('send-telegram-notification', {
              body: { 
                order: { ...data, images },
                action: 'status_change'
              }
            });
            
            console.log("Status update notification sent successfully");
          } catch (notifyError) {
            console.error('Failed to send status update notification:', notifyError);
          }
        }
        
        return data;
      }
    },
    onSuccess: () => {
      // Invalidate ALL related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order'] });
      
      toast({
        title: "Заказ обновлен",
        description: "Данные заказа успешно обновлены",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error updating order:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить заказ",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: any) => {
    updateOrderMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`
          ${isMobile 
            ? 'max-w-[95vw] max-h-[95vh] w-full h-full m-2 p-4' 
            : 'max-w-6xl max-h-[95vh]'
          } 
          overflow-y-auto
        `}
      >
        <OrderEditHeader order={order} />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <OrderEditTabs
              order={order}
              form={form}
              orderImages={orderImages}
              orderVideos={orderVideos}
              onImagesUpload={handleImagesUpload}
              onVideoUpload={handleVideoUpload}
              onVideoDelete={handleVideoDelete}
            />

            <DialogFooter 
              className={`
                flex items-center justify-between bg-gray-50 
                ${isMobile ? '-mx-4 -mb-4 px-4 py-3 flex-col gap-2' : '-mx-6 -mb-6 px-6 py-4 flex-row'}
              `}
            >
              {!isMobile && (
                <div className="text-xs text-gray-500">
                  Используйте Ctrl+S для быстрого сохранения, Esc для закрытия
                </div>
              )}
              <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className={isMobile ? 'flex-1' : ''}
                >
                  <X className="mr-2 h-4 w-4" />
                  Отмена
                </Button>
                <Button 
                  type="submit"
                  disabled={updateOrderMutation.isPending}
                  className={isMobile ? 'flex-1' : ''}
                >
                  {updateOrderMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isMobile ? 'Сохр...' : 'Сохранение...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Сохранить
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
