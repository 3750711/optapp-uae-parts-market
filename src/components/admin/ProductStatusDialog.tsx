
import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { useAdminAccess } from '@/hooks/useAdminAccess';

const formSchema = z.object({
  status: z.enum(['pending', 'active', 'sold', 'archived'])
});

interface ProductStatusDialogProps {
  product: Product;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export const ProductStatusDialog = ({ product, trigger, onSuccess }: ProductStatusDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const { isAdmin } = useAdminAccess();
  const [isSendingNotification, setIsSendingNotification] = React.useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: product.status,
    },
  });

  // Check if a notification was recently sent
  const shouldSendNotification = (product: Product, newStatus: string): boolean => {
    // Only send notifications for active or sold status
    if (newStatus !== 'active' && newStatus !== 'sold') {
      return false;
    }

    // Check if notification was sent recently
    if (product.last_notification_sent_at) {
      const lastSent = new Date(product.last_notification_sent_at);
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      if (lastSent > fiveMinutesAgo) {
        return false;
      }
    }
    return true;
  };

  const updateNotificationTimestamp = async (productId: string): Promise<void> => {
    try {
      await supabase
        .from('products')
        .update({ last_notification_sent_at: new Date().toISOString() })
        .eq('id', productId);
    } catch (error) {
      console.error('Error updating notification timestamp:', error);
    }
  };

  const sendTelegramNotification = async (updatedProduct: Product) => {
    setIsSendingNotification(true);
    try {
      // Determine notification type based on status
      const notificationType = updatedProduct.status === 'sold' ? 'sold' : 'status_change';
      
      // First, get a fresh product with all images
      const { data: freshProduct, error: fetchError } = await supabase
        .from('products')
        .select(`*, product_images(*)`)
        .eq('id', updatedProduct.id)
        .single();

      if (fetchError || !freshProduct) {
        throw new Error(fetchError?.message || 'Failed to fetch product details');
      }
      
      // Update notification timestamp
      await updateNotificationTimestamp(updatedProduct.id);
      
      // Now call the edge function with the complete product data
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { 
          productId: freshProduct.id,
          notificationType: notificationType
        }
      });
      
      if (error) {
        console.error('Error calling function:', error);
        throw new Error(error.message);
      }
      
      if (data && data.success) {
        toast({
          title: "Успех",
          description: "Уведомление об изменении статуса отправлено в Telegram",
        });
      } else {
        toast({
          title: "Внимание",
          description: (data && data.message) || "Уведомление не было отправлено",
          variant: "destructive", 
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить уведомление: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    } finally {
      setIsSendingNotification(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isAdmin) {
      toast({
        title: "Ошибка",
        description: "Только администратор может изменять статус товара",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update product status
      const { data, error } = await supabase
        .from('products')
        .update({ status: values.status })
        .eq('id', product.id)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Успех",
        description: "Статус товара успешно обновлен",
      });
      
      // Check if we should send notification based on the new status
      if (data && data.length > 0 && 
          (values.status === 'active' || values.status === 'sold') && 
          shouldSendNotification(product, values.status)) {
        await sendTelegramNotification(data[0]);
      }
      
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating product status:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус товара: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает проверки';
      case 'active': return 'Опубликован';
      case 'sold': return 'Продан';
      case 'archived': return 'Архив';
      default: return status;
    }
  };

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Изменить статус товара</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <SelectContent>
                      <SelectItem value="pending">Ожидает проверки (не виден в каталоге)</SelectItem>
                      <SelectItem value="active">Опубликован (виден в каталоге, доступен для заказа)</SelectItem>
                      <SelectItem value="sold">Продан (виден в каталоге, не доступен для заказа)</SelectItem>
                      <SelectItem value="archived">Архив (не виден в каталоге)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isSendingNotification}>
                {isSendingNotification ? "Отправка..." : "Сохранить"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
