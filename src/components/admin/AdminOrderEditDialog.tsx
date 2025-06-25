
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Database } from '@/integrations/supabase/types';
import { Loader2, Save, X } from "lucide-react";
import { OrderEditHeader } from "@/components/admin/order/OrderEditHeader";
import { OrderEditTabs } from "@/components/admin/order/OrderEditTabs";
import { useAdminOrderForm } from '@/hooks/useAdminOrderForm';
import { useOrderMedia } from '@/hooks/useOrderMedia';

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
  const {
    orderImages,
    orderVideos,
    handleImagesChange,
    handleVideosChange,
    handleVideoDelete,
  } = useOrderMedia({ order, open });

  const { form, onSubmit, isSaving } = useAdminOrderForm({
    order,
    onClose: () => onOpenChange(false),
    orderImages,
    orderVideos,
  });

  if (!order) {
    return null;
  }

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[95vh] min-h-[600px] flex flex-col p-0 gap-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full bg-slate-50">
            <div className="flex-shrink-0">
              <OrderEditHeader order={order} onStatusChange={onStatusChange} />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-y-auto px-6 py-4">
                <OrderEditTabs
                  form={form}
                  order={order}
                  orderImages={orderImages}
                  onImagesChange={handleImagesChange}
                  orderVideos={orderVideos}
                  onVideosChange={handleVideosChange}
                  onVideoDelete={handleVideoDelete}
                />
              </div>
            </div>
            
            <DialogFooter className="bg-background px-6 py-3 border-t flex-shrink-0">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Закрыть
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Сохранить
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
