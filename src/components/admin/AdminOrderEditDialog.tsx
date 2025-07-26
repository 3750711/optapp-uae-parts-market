
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
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
    onStatusChange,
  });

  if (!order) {
    return null;
  }

  const handleClose = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full h-[100dvh] md:h-[95vh] md:w-[95vw] md:max-h-[90vh] min-h-0 flex flex-col p-0 gap-0 m-0 md:m-6 rounded-none md:rounded-lg overflow-hidden">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full bg-slate-50 relative">
            <div className="flex-shrink-0">
              <OrderEditHeader order={order} form={form} />
            </div>

            <div className="flex-1 min-h-0 overflow-hidden pb-20 md:pb-0">
              <ScrollArea 
                className="h-full w-full"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  touchAction: 'pan-y',
                }}
              >
                <div className="px-4 md:px-6 py-4 pb-6 md:pb-4">
                  <OrderEditTabs
                    form={form}
                    order={order}
                    orderImages={orderImages}
                    onImagesChange={handleImagesChange}
                    orderVideos={orderVideos}
                    onVideosChange={handleVideosChange}
                    onVideoDelete={handleVideoDelete}
                    onStatusChange={onStatusChange}
                  />
                </div>
              </ScrollArea>
            </div>
            
            {/* Mobile: Fixed footer */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] z-50 shadow-lg">
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isSaving}
                  className="flex-1 h-12 px-4 text-base font-medium touch-target"
                >
                  <X className="h-4 w-4 mr-2" />
                  Закрыть
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-1 h-12 px-4 text-base font-medium touch-target"
                >
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
              </div>
            </div>

            {/* Desktop: Normal footer */}
            <DialogFooter className="hidden md:flex bg-background px-6 py-3 border-t flex-shrink-0 flex-row gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose} 
                disabled={isSaving}
                className="h-10 px-4"
              >
                <X className="h-4 w-4 mr-2" />
                Закрыть
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="h-10 px-4"
              >
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
