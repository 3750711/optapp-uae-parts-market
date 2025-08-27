
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, Camera, MessageSquare, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { OrderConfirmEvidenceWizard } from "@/components/admin/OrderConfirmEvidenceWizard";
import { getSellerOrdersTranslations } from '@/utils/translations/sellerOrders';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface OrderConfirmImagesDialogProps {
  orderId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const OrderConfirmImagesDialog = ({ orderId, open, onOpenChange }: OrderConfirmImagesDialogProps) => {
  const [showWizard, setShowWizard] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ url: string; category: string } | null>(null);
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const { profile } = useAuth();
  const { toast } = useToast();
  const t = getSellerOrdersTranslations(language);

  const isAdmin = profile?.user_type === 'admin';

  // Query for order data (for admin info)
  const { data: orderData } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('order_number, buyer_opt_id, title, price')
        .eq('id', orderId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: profile?.user_type === 'admin'
  });

  const { data: chatImages } = useQuery({
    queryKey: ['confirm-images', orderId, 'chat_screenshot'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId)
        .eq('category', 'chat_screenshot');

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const { data: signedImages } = useQuery({
    queryKey: ['confirm-images', orderId, 'signed_product'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId)
        .eq('category', 'signed_product');

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const { data: legacyImages } = useQuery({
    queryKey: ['confirm-images', orderId, 'legacy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId)
        .is('category', null);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const hasChatEvidence = (chatImages?.length || 0) > 0;
  const hasSignedEvidence = (signedImages?.length || 0) > 0;
  const hasLegacyEvidence = (legacyImages?.length || 0) > 0;
  const hasAnyEvidence = hasChatEvidence || hasSignedEvidence || hasLegacyEvidence;

  const handleWizardComplete = () => {
    setShowWizard(false);
    // Invalidate all related queries to refresh the data
    queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
  };

  const handleImageDelete = async (url: string, category: string) => {
    try {
      const { error } = await supabase
        .from('confirm_images')
        .delete()
        .eq('order_id', orderId)
        .eq('url', url)
        .eq('category', category === 'legacy' ? null : category);

      if (error) throw error;

      // Invalidate all related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['confirm-images', orderId] });
      
      toast({
        title: "Успешно",
        description: "Изображение удалено",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить изображение",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (url: string, category: string) => {
    setDeleteConfirm({ url, category });
  };

  const renderEvidenceSection = (
    title: string,
    icon: React.ReactNode,
    images: string[] | undefined,
    hasEvidence: boolean,
    category: string
  ) => (
    <div className="space-y-2 xs:space-y-3">
      <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
        {icon}
        <h3 className="font-medium text-xs xs:text-sm">{title}</h3>
        <span className="text-xs text-muted-foreground">({images?.length || 0})</span>
        {hasEvidence ? (
          <CheckCircle className="h-3 w-3 xs:h-4 xs:w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-3 w-3 xs:h-4 xs:w-4 text-orange-500" />
        )}
      </div>
      
      {hasEvidence ? (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 xs:gap-2 sm:gap-3">
          {images?.map((url, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={url}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover rounded-md xs:rounded-lg border"
                loading="lazy"
              />
              {isAdmin && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md xs:rounded-lg flex items-center justify-center touch-none">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => confirmDelete(url, category)}
                    className="h-7 w-7 xs:h-8 xs:w-8 p-0 touch-auto"
                  >
                    <Trash2 className="h-3 w-3 xs:h-4 xs:w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs xs:text-sm text-muted-foreground italic">
          {t.noEvidenceUploaded} {title.toLowerCase()}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] xs:w-[90vw] sm:w-[85vw] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[95vh] xs:max-h-[90vh] sm:max-h-[85vh] p-0 flex flex-col">
          <div className="flex flex-col flex-1">
            <DialogHeader className="px-3 xs:px-4 sm:px-6 py-2 xs:py-3 sm:py-4 border-b shrink-0">
              <DialogTitle className="text-base xs:text-lg sm:text-xl">{t.evidenceTitle}</DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="flex-1 min-h-0 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-3 xs:space-y-4 sm:space-y-6 px-3 xs:px-4 sm:px-6 py-2 xs:py-3 sm:py-4 pb-safe">
            {/* Admin Order Information - For verification against photos */}
            {profile?.user_type === 'admin' && orderData && (
              <div className="bg-gradient-to-br from-yellow-100 to-amber-50 border border-yellow-300 rounded-lg p-1.5 xs:p-2 sm:p-3 mb-2 xs:mb-3">
                <div className="text-yellow-800 font-bold mb-1.5 xs:mb-2 text-xs uppercase tracking-wide">
                  Order Information - For Photo Verification
                </div>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-1.5 xs:gap-2">
                  <div className="bg-white rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-yellow-300">
                    <div className="text-yellow-700 font-medium text-xs">BUYER'S OPT ID:</div>
                    <div className="font-bold text-yellow-900 tracking-wider text-xs xs:text-sm sm:text-base break-all">
                      {orderData.buyer_opt_id || 'NOT SPECIFIED'}
                    </div>
                  </div>
                  <div className="bg-white rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-yellow-300">
                    <div className="text-yellow-700 font-medium text-xs">ORDER NUMBER:</div>
                    <div className="font-bold text-yellow-900 tracking-wider text-xs xs:text-sm sm:text-base">
                      #{orderData.order_number || 'NOT SPECIFIED'}
                    </div>
                  </div>
                  <div className="bg-white rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-yellow-300">
                    <div className="text-yellow-700 font-medium text-xs">PRODUCT NAME:</div>
                    <div className="font-bold text-yellow-900 text-xs sm:text-sm truncate">
                      {orderData.title || 'NOT SPECIFIED'}
                    </div>
                  </div>
                  <div className="bg-white rounded-md xs:rounded-lg p-1.5 xs:p-2 border border-yellow-300">
                    <div className="text-yellow-700 font-medium text-xs">PRICE:</div>
                    <div className="font-bold text-yellow-900 tracking-wider text-xs xs:text-sm sm:text-base">
                      ${Number(orderData.price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Overview */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-4 p-2 xs:p-3 sm:p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">{t.chatScreenshotLabel}</span>
                {hasChatEvidence ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="text-sm">{t.signedProductLabel}</span>
                {hasSignedEvidence ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>

            {/* Evidence Sections */}
            <div className="grid gap-3 xs:gap-4 sm:gap-6">
              {renderEvidenceSection(
                t.chatScreenshotsTitle,
                <MessageSquare className="h-3 w-3 xs:h-4 xs:w-4" />,
                chatImages,
                hasChatEvidence,
                'chat_screenshot'
              )}
              
              {renderEvidenceSection(
                t.signedProductTitle,
                <Camera className="h-3 w-3 xs:h-4 xs:w-4" />,
                signedImages,
                hasSignedEvidence,
                'signed_product'
              )}

              {/* Legacy Images (if any) */}
              {hasLegacyEvidence && renderEvidenceSection(
                t.additionalEvidence,
                <Check className="h-3 w-3 xs:h-4 xs:w-4" />,
                legacyImages,
                hasLegacyEvidence,
                'legacy'
              )}
            </div>

            {/* Add More Evidence Button */}
            <div className="flex justify-center pt-3 xs:pt-4 border-t mt-2 xs:mt-3 sm:mt-4">
              <Button
                onClick={() => setShowWizard(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 xs:gap-2 h-8 xs:h-9 sm:h-10 px-3 xs:px-4 text-xs xs:text-sm touch-auto"
              >
                <Plus className="h-3 w-3 xs:h-4 xs:w-4" />
                {t.addMoreEvidence}
              </Button>
            </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evidence Upload Wizard */}
      <OrderConfirmEvidenceWizard
        open={showWizard}
        orderId={orderId}
        onComplete={handleWizardComplete}
        onCancel={() => setShowWizard(false)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить изображение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Изображение будет навсегда удалено из системы.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  handleImageDelete(deleteConfirm.url, deleteConfirm.category);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
