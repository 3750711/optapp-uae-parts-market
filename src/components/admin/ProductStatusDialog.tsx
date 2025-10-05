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
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';

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

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: product.status,
    },
  });
  const { isSubmitting, guardedSubmit } = useSubmissionGuard({ timeout: 3000 });

  const onSubmit = (values: z.infer<typeof formSchema>) =>
    guardedSubmit(async () => {
    if (!isAdmin) {
      toast({
        title: "Ошибка",
        description: "Только администратор может изменять статус товара",
        variant: "destructive",
      });
      return;
    }

    // Avoid redundant updates and duplicate notifications
    if (values.status === product.status) {
      console.info(
        `ℹ️ [ProductStatusDialog] No status change detected for product: ${product.id}`
      );
      toast({
        title: "Без изменений",
        description: "Вы выбрали тот же статус, обновление не требуется",
      });
      return;
    }

    try {
      console.log(
        `🔄 [ProductStatusDialog] Admin changing product status: ${product.status} -> ${values.status} for product: ${product.id}`
      );

      // Get current user for logging
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Update product status - DB triggers will handle notifications
      console.log(`💾 [ProductStatusDialog] Updating product status in database...`);
      const { data, error } = await supabase
        .from('products')
        .update({ status: values.status })
        .eq('id', product.id)
        .select();

      if (error) {
        console.error("❌ [ProductStatusDialog] Database update failed:", error);
        throw error;
      }

      console.log(`✅ [ProductStatusDialog] Database update successful:`, data);

      // Note: Removed fallback Telegram notification to avoid duplicate messages.

      // Логирование отключено - используется Microsoft Clarity

      toast({
        title: "Успех",
        description: "Статус товара успешно обновлен",
      });

      console.log(`🎉 [ProductStatusDialog] Product status change completed successfully`);
      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('❌ [ProductStatusDialog] Error in onSubmit:', error);
      toast({
        title: "Ошибка",
        description:
          "Не удалось обновить статус товара: " +
          (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    }
  });

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
<Button type="submit" disabled={isSubmitting}>
  Сохранить
</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
