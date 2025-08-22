import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, EyeOff, Archive, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';
import { getCommonTranslations } from '@/utils/translations/common';

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
  onProductUpdate: () => void;
}

const SellerProductActions: React.FC<SellerProductActionsProps> = ({
  product,
  onProductUpdate,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);
  const c = getCommonTranslations(language);
  

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
      
      
      toast({
        title: sp.productActions?.updated || "Статус обновлен",
        description: "Статус вашего объявления успешно изменен.",
      });
      onProductUpdate();
    },
    onError: (error) => {
      toast({
        title: c.errors?.title || "Ошибка",
        description: sp.productActions?.updateFailed || "Не удалось обновить статус объявления.",
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

  const getStatusInfo = () => {
    switch (product.status) {
      case 'active':
        return {
          color: "bg-green-100 text-green-800",
          text: "Активное"
        };
      case 'pending':
        return {
          color: "bg-yellow-100 text-yellow-800",
          text: "На модерации"
        };
      case 'sold':
        return {
          color: "bg-blue-100 text-blue-800",
          text: "Продано"
        };
      case 'archived':
        return {
          color: "bg-gray-100 text-gray-800",
          text: "В архиве"
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          text: "Неизвестно"
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
            {sp.containerStatus || 'Текущий статус'}:
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
                    <AlertDialogTitle>{c.buttons.hide || 'Скрыть'} объявление?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Объявление будет помещено в архив и не будет отображаться в поиске.
                      Вы сможете восстановить его позже.
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
                    <AlertDialogTitle>Отметить как проданное?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Объявление будет помечено как проданное и убрано из активных объявлений.
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