
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, Camera, MessageSquare, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { OrderConfirmEvidenceWizard } from "@/components/admin/OrderConfirmEvidenceWizard";
import { getSellerOrdersTranslations } from '@/utils/translations/sellerOrders';
import { useLanguage } from '@/hooks/useLanguage';

interface OrderConfirmImagesDialogProps {
  orderId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const OrderConfirmImagesDialog = ({ orderId, open, onOpenChange }: OrderConfirmImagesDialogProps) => {
  const [showWizard, setShowWizard] = useState(false);
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const t = getSellerOrdersTranslations(language);

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

  const renderEvidenceSection = (
    title: string,
    icon: React.ReactNode,
    images: string[] | undefined,
    hasEvidence: boolean
  ) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-medium text-sm">{title}</h3>
        {hasEvidence ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-orange-500" />
        )}
      </div>
      
      {hasEvidence ? (
        <div className="grid grid-cols-2 gap-2">
          {images?.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`${title} ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">
          {t.noEvidenceUploaded} {title.toLowerCase()}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t.evidenceTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Status Overview */}
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
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
            <div className="grid gap-6">
              {renderEvidenceSection(
                t.chatScreenshotsTitle,
                <MessageSquare className="h-4 w-4" />,
                chatImages,
                hasChatEvidence
              )}
              
              {renderEvidenceSection(
                t.signedProductTitle,
                <Camera className="h-4 w-4" />,
                signedImages,
                hasSignedEvidence
              )}

              {/* Legacy Images (if any) */}
              {hasLegacyEvidence && renderEvidenceSection(
                t.additionalEvidence,
                <Check className="h-4 w-4" />,
                legacyImages,
                hasLegacyEvidence
              )}
            </div>

            {/* Add More Evidence Button */}
            <div className="flex justify-center pt-4 border-t">
              <Button
                onClick={() => setShowWizard(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t.addMoreEvidence}
              </Button>
            </div>
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
    </>
  );
};
