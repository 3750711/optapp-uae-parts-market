import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, EyeOff, Archive, RotateCcw, Trash2, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';
import { getCommonTranslations } from '@/utils/translations/common';
import { getProductStatusTranslations } from '@/utils/translations/productStatuses';
import { useTelegramNotification } from "@/hooks/useTelegramNotification";

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

interface SellerProductActionsProps {
  product: Product;
  showAddNewButton?: boolean;
}

const SellerProductActions: React.FC<SellerProductActionsProps> = ({
  product,
  showAddNewButton = false,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);
  const c = getCommonTranslations(language);
  const t = getProductStatusTranslations(language);
  const { sendProductNotification } = useTelegramNotification();

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('products')
        .update({ status: newStatus })
        .eq('id', product.id);
      
      if (error) throw error;
      return newStatus;
    },
    onSuccess: async (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['seller-product', product.id] });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      
      // Send notification when status changed to sold
      if (newStatus === 'sold') {
        await sendProductNotification(product.id, 'sold');
      }
      
      toast({
        title: sp.productActions?.updated || sp.mobileActions.statusUpdated,
        description: sp.mobileActions.statusUpdateDescription,
      });
    },
    onError: (error) => {
      toast({
        title: sp.error,
        description: sp.productActions?.updateFailed || sp.mobileActions.statusUpdateFailed,
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
    // Navigate to edit product page (to be implemented)
    navigate(`/seller/edit-product/${product.id}`);
  };

  const handleAddNewProduct = () => {
    navigate('/seller/add-product');
  };

  const getStatusInfo = () => {
    switch (product.status) {
      case 'active':
        return {
          color: "bg-green-100 text-green-800",
          text: t.statuses.active
        };
      case 'pending':
        return {
          color: "bg-yellow-100 text-yellow-800",
          text: t.statuses.pending
        };
      case 'sold':
        return {
          color: "bg-blue-100 text-blue-800",
          text: t.statuses.sold
        };
      case 'archived':
        return {
          color: "bg-gray-100 text-gray-800",
          text: t.statuses.archived
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          text: t.statuses.unknown
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-card border rounded-lg p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Current Status */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            {c.fields.currentStatus}:
          </span>
          <Badge className={statusInfo.color}>
            {statusInfo.text}
          </Badge>
          {product.view_count && product.view_count > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {product.view_count} {sp.productInfoDetails?.views || 'просмотров'}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {/* Add New Product Button */}
          {showAddNewButton && (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleAddNewProduct}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {sp.addProduct}
            </Button>
          )}

          {/* Edit Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            {c.buttons.edit}
          </Button>

          {/* Status Change Buttons */}
          {product.status === 'active' && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <EyeOff className="h-4 w-4" />
                    {c.buttons.hide || 'Скрыть'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.dialogs.hideProduct.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.dialogs.hideProduct.description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{c.buttons.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusChange('archived')}>
                      {c.buttons.hide || 'Скрыть'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" />
                    {sp.shipped || 'Продано'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.dialogs.markSold.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.dialogs.markSold.description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{c.buttons.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusChange('sold')}>
                      {sp.shipped || 'Пометить как проданное'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}

          {product.status === 'archived' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleStatusChange('active')}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {c.buttons.restore || 'Восстановить'}
            </Button>
          )}

        </div>
      </div>
    </div>
  );
};

export default SellerProductActions;