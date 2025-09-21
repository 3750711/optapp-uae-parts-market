import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Archive, RotateCcw, Share } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductStatusTranslations } from "@/utils/translations/productStatuses";
import { getSellerPagesTranslations } from "@/utils/translations/sellerPages";
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

interface MobileSellerActionsProps {
  product: Product;
}

const MobileSellerActions: React.FC<MobileSellerActionsProps> = ({
  product,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);
  const sp = getSellerPagesTranslations(language);

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', product.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-product', product.id] });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast({
        title: sp.mobileActions.statusUpdated,
        description: sp.mobileActions.statusUpdateDescription,
      });
    },
    onError: () => {
      toast({
        title: sp.error,
        description: sp.mobileActions.statusUpdateFailed,
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (newStatus: string) => {
    setIsUpdating(true);
    statusMutation.mutate(newStatus);
    setTimeout(() => setIsUpdating(false), 1000);
  };

  const handleEdit = () => {
    navigate(`/seller/edit-product/${product.id}`);
  };

  const handleViewOffers = () => {
    navigate('/seller/price-offers', { 
      state: { productId: product.id } 
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `${sp.mobileActions.shareText}: ${product.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: sp.mobileActions.linkCopied,
        description: sp.mobileActions.linkCopiedDescription,
      });
    }
  };

  return (
    <>
      {/* Floating Share Button */}
      <div className="fixed bottom-24 right-4 z-30">
        <Button
          size="icon"
          variant="secondary"
          className="rounded-full h-12 w-12 shadow-lg"
          onClick={handleShare}
        >
          <Share className="h-5 w-5" />
        </Button>
      </div>

      {/* Bottom Sticky Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
        <div className="flex gap-2">
          {/* Status Action Button - Always render for hook stability */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="default" 
                className="flex-1 flex items-center gap-2"
                disabled={product.status !== 'active'}
                style={{ display: product.status === 'active' ? 'flex' : 'none' }}
              >
                <Archive className="h-4 w-4" />
                {t.actions.markSoldShort}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.markSoldDialog.title}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.markSoldDialog.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.markSoldDialog.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleStatusChange('sold')}>
                  {t.actions.markSold}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button 
            variant="default" 
            className="flex-1 flex items-center gap-2"
            onClick={() => handleStatusChange('active')}
            disabled={isUpdating}
            style={{ display: product.status === 'archived' ? 'flex' : 'none' }}
          >
            <RotateCcw className="h-4 w-4" />
            {t.actions.restore}
          </Button>
        </div>
      </div>
    </>
  );
};

export default MobileSellerActions;