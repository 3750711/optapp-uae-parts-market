
import React from 'react';
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Database } from '@/integrations/supabase/types';
import { Loader2 } from "lucide-react";
import { MediaUploadSection } from "@/components/admin/order/MediaUploadSection";

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
  const [orderImages, setOrderImages] = React.useState<string[]>([]);
  const [orderVideos, setOrderVideos] = React.useState<string[]>([]);

  const form = useForm({
    defaultValues: {
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
      // Load images from the images field in orders table
      const images = order.images || [];
      setOrderImages(images);

      // Load videos from order_videos table
      const loadOrderVideos = async () => {
        try {
          const { data: videos, error } = await supabase
            .from('order_videos')
            .select('url')
            .eq('order_id', order.id);

          if (error) throw error;
          
          const videoUrls = videos?.map(video => video.url) || [];
          setOrderVideos(videoUrls);
        } catch (error) {
          console.error('Error loading order videos:', error);
        }
      };

      loadOrderVideos();
    }
  }, [order, open]);

  React.useEffect(() => {
    if (order) {
      form.reset({
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

  const handleImagesUpload = async (urls: string[]) => {
    if (!order?.id) return;

    try {
      console.log('Uploading images to order:', { orderId: order.id, urls });
      
      // Update the images field in the orders table
      const { error } = await supabase
        .from('orders')
        .update({ images: urls })
        .eq('id', order.id);

      if (error) throw error;

      // Update local state
      setOrderImages(urls);

      const newImagesCount = urls.length - orderImages.length;
      if (newImagesCount > 0) {
        toast({
          title: "Успешно",
          description: `Добавлено ${newImagesCount} фотографий`,
        });
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', order.id] });
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
      console.log('Uploading videos to order:', { orderId: order.id, urls });
      
      // Insert new videos into order_videos table
      const { error } = await supabase
        .from('order_videos')
        .insert(
          urls.map(url => ({
            order_id: order.id,
            url
          }))
        );

      if (error) throw error;

      // Update local state
      setOrderVideos(prev => [...prev, ...urls]);

      toast({
        title: "Успешно",
        description: `Добавлено ${urls.length} видео`,
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
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
      const { error } = await supabase
        .from('order_videos')
        .delete()
        .eq('order_id', order.id)
        .eq('url', url);

      if (error) throw error;

      // Update local state
      setOrderVideos(prev => prev.filter(videoUrl => videoUrl !== url));

      toast({
        title: "Успешно",
        description: "Видео удалено",
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
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
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: "Заказ обновлен",
        description: "Данные заказа успешно обновлены",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: any) => {
    updateOrderMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактирование заказа № {order?.order_number}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Наименование</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Бренд</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Модель</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена ($)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Способ доставки</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите способ доставки" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="self_pickup">Самовывоз</SelectItem>
                        <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
                        <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_price_confirm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Подтвержденная стоимость доставки ($)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="place_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество мест</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white border border-gray-200 shadow-md">
                        <SelectItem value="created">Создан</SelectItem>
                        <SelectItem value="seller_confirmed">Подтвержден продавцом</SelectItem>
                        <SelectItem value="admin_confirmed">Подтвержден администратором</SelectItem>
                        <SelectItem value="processed">Зарегистрирован</SelectItem>
                        <SelectItem value="shipped">Отправлен</SelectItem>
                        <SelectItem value="delivered">Доставлен</SelectItem>
                        <SelectItem value="cancelled">Отменен</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Media Upload Section */}
            {order?.id && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Медиафайлы заказа</h3>
                <MediaUploadSection
                  images={orderImages}
                  videos={orderVideos}
                  onImagesUpload={handleImagesUpload}
                  onVideoUpload={handleVideoUpload}
                  onVideoDelete={handleVideoDelete}
                  orderId={order.id}
                />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button 
                type="submit"
                disabled={updateOrderMutation.isPending}
              >
                {updateOrderMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  'Сохранить'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
