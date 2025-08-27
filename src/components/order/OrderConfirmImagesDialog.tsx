
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
import { Check, Camera, MessageSquare, CheckCircle, AlertCircle, Plus, Trash2, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [zoomImage, setZoomImage] = useState<{ url: string; images: string[]; currentIndex: number; title: string } | null>(null);
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

  const handleImageZoom = (url: string, images: string[], title: string) => {
    const currentIndex = images.findIndex(img => img === url);
    setZoomImage({ url, images, currentIndex, title });
  };

  const navigateZoomImage = (direction: 'prev' | 'next') => {
    if (!zoomImage) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, zoomImage.currentIndex - 1)
      : Math.min(zoomImage.images.length - 1, zoomImage.currentIndex + 1);
    
    setZoomImage({
      ...zoomImage,
      url: zoomImage.images[newIndex],
      currentIndex: newIndex
    });
  };

  const renderEvidenceSection = (
    title: string,
    icon: React.ReactNode,
    images: string[] | undefined,
    hasEvidence: boolean,
    category: string
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {icon}
          <h3 className="font-medium text-xs xs:text-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">({images?.length || 0})</span>
          {hasEvidence ? (
            <CheckCircle className="h-3 w-3 xs:h-4 xs:w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-3 w-3 xs:h-4 xs:w-4 text-orange-500" />
          )}
        </div>
      </div>
      
      {hasEvidence ? (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 xs:gap-2">
          {images?.map((url, index) => (
            <div key={index} className="relative group">
              <div 
                className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer"
                onClick={() => handleImageZoom(url, images, title)}
              >
                <img
                  src={url}
                  alt={`${title} ${index + 1}`}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                  loading="lazy"
                />
              </div>
              
              {/* Zoom overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleImageZoom(url, images, title)}
                  className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white text-black"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              
              {isAdmin && (
                <>
                  {/* Always visible delete button on mobile */}
                  <div className="absolute top-1 right-1 xs:opacity-0 xs:group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(url, category);
                      }}
                      className="h-6 w-6 xs:h-7 xs:w-7 p-0 rounded-full shadow-lg"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground italic p-4 text-center bg-muted/30 rounded-lg">
          {t.noEvidenceUploaded} {title.toLowerCase()}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-[475px]:w-full xs:w-[95vw] sm:w-[90vw] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl h-[100dvh] max-w-[475px]:h-[100dvh] xs:max-h-[95vh] sm:max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <div className="flex flex-col flex-1">
            <DialogHeader className="px-2 xs:px-3 sm:px-4 py-2 xs:py-3 border-b shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-sm xs:text-base sm:text-lg font-semibold text-center">{t.evidenceTitle}</DialogTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange?.(false)}
                  className="h-8 w-8 p-0 rounded-full shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <ScrollArea className="flex-1 min-h-0" style={{ WebkitOverflowScrolling: 'touch', overflowY: 'auto' }}>
              <div className="space-y-2 xs:space-y-3 sm:space-y-4 px-2 xs:px-3 sm:px-4 py-2 xs:py-3 pb-[env(safe-area-inset-bottom,1rem)]">
            {/* Admin Order Information - For verification against photos */}
            {profile?.user_type === 'admin' && orderData && (
              <div className="bg-gradient-to-br from-yellow-100 to-amber-50 border border-yellow-300 rounded-lg p-2 xs:p-3 mb-2">
                <div className="text-yellow-800 font-bold mb-2 text-xs uppercase tracking-wide flex items-center gap-1">
                  <span>Order Info</span>
                  <span className="text-[10px] font-normal">(For Verification)</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="bg-white rounded p-1.5 border border-yellow-300">
                    <div className="text-yellow-700 font-medium text-[10px] xs:text-xs">BUYER OPT ID:</div>
                    <div className="font-bold text-yellow-900 text-xs break-all">
                      {orderData.buyer_opt_id || 'NOT SPECIFIED'}
                    </div>
                  </div>
                  <div className="bg-white rounded p-1.5 border border-yellow-300">
                    <div className="text-yellow-700 font-medium text-[10px] xs:text-xs">ORDER #:</div>
                    <div className="font-bold text-yellow-900 text-xs">
                      #{orderData.order_number || 'NOT SPECIFIED'}
                    </div>
                  </div>
                  <div className="bg-white rounded p-1.5 border border-yellow-300">
                    <div className="text-yellow-700 font-medium text-[10px] xs:text-xs">PRODUCT:</div>
                    <div className="font-bold text-yellow-900 text-xs line-clamp-2">
                      {orderData.title || 'NOT SPECIFIED'}
                    </div>
                  </div>
                  <div className="bg-white rounded p-1.5 border border-yellow-300">
                    <div className="text-yellow-700 font-medium text-[10px] xs:text-xs">PRICE:</div>
                    <div className="font-bold text-yellow-900 text-xs">
                      ${Number(orderData.price || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Overview */}
            <div className="grid grid-cols-1 gap-2 p-2 xs:p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="text-xs xs:text-sm font-medium">{t.chatScreenshotLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">({chatImages?.length || 0})</span>
                  {hasChatEvidence ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 text-purple-600" />
                  <span className="text-xs xs:text-sm font-medium">{t.signedProductLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">({signedImages?.length || 0})</span>
                  {hasSignedEvidence ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Evidence Sections */}
            <div className="space-y-3 xs:space-y-4">
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

            {/* Add More Evidence Button - Sticky on mobile */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-2 xs:p-3 mt-4 -mx-2 xs:-mx-3 sm:-mx-4">
              <Button
                onClick={() => setShowWizard(true)}
                variant="default"
                className="w-full flex items-center justify-center gap-2 h-10 xs:h-11 text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
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

      {/* Image Zoom Modal */}
      <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="w-full max-w-6xl max-h-[95vh] p-0 overflow-hidden bg-black/95">
          {zoomImage && (
            <div className="relative flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm text-white">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{zoomImage.title}</h3>
                  <p className="text-xs text-white/70">
                    {zoomImage.currentIndex + 1} из {zoomImage.images.length}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoomImage(null)}
                  className="h-8 w-8 p-0 rounded-full text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Image Container */}
              <div className="flex-1 flex items-center justify-center p-4 relative">
                <img
                  src={zoomImage.url}
                  alt={`${zoomImage.title} ${zoomImage.currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />

                {/* Navigation Buttons */}
                {zoomImage.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateZoomImage('prev')}
                      disabled={zoomImage.currentIndex === 0}
                      className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigateZoomImage('next')}
                      disabled={zoomImage.currentIndex === zoomImage.images.length - 1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-30"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>

              {/* Image Indicator Dots */}
              {zoomImage.images.length > 1 && (
                <div className="flex justify-center gap-1 p-4">
                  {zoomImage.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setZoomImage({
                        ...zoomImage,
                        url: zoomImage.images[index],
                        currentIndex: index
                      })}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === zoomImage.currentIndex 
                          ? 'bg-white' 
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
