import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Archive, RotateCcw, Share } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
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
  onProductUpdate: () => void;
}

const MobileSellerActions: React.FC<MobileSellerActionsProps> = ({
  product,
  onProductUpdate,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

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
        title: "Статус обновлен",
        description: "Статус вашего объявления успешно изменен.",
      });
      onProductUpdate();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус объявления.",
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
          text: `Проверьте это объявление: ${product.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Ссылка скопирована",
        description: "Ссылка на объявление скопирована в буфер обмена",
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
          {/* Edit Button */}
          <Button 
            variant="outline" 
            className="flex-1 flex items-center gap-2"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </Button>

          {/* View Offers Button */}
          <Button 
            variant="outline" 
            className="flex-1 flex items-center gap-2"
            onClick={handleViewOffers}
          >
            <Eye className="h-4 w-4" />
            Предложения
          </Button>

          {/* Status Action Button */}
          {product.status === 'active' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="default" 
                  className="flex-1 flex items-center gap-2"
                >
                  <Archive className="h-4 w-4" />
                  {product.status === 'active' ? 'Продано' : 'Действие'}
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
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange('sold')}>
                    Пометить как проданное
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {(product.status === 'archived' || product.status === 'sold') && (
            <Button 
              variant="default" 
              className="flex-1 flex items-center gap-2"
              onClick={() => handleStatusChange('active')}
              disabled={isUpdating}
            >
              <RotateCcw className="h-4 w-4" />
              Восстановить
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default MobileSellerActions;