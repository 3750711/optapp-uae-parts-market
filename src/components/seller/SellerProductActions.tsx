import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, EyeOff, Archive, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
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
  onProductUpdate: () => void;
}

const SellerProductActions: React.FC<SellerProductActionsProps> = ({
  product,
  onProductUpdate,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
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
      
      // Send fallback Telegram notification
      const notificationType = newStatus === 'sold' ? 'sold' : 'status_change';
      await sendProductNotification(product.id, notificationType);
      
      toast({
        title: "Статус обновлен",
        description: "Статус вашего объявления успешно изменен.",
      });
      onProductUpdate();
    },
    onError: (error) => {
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
            Текущий статус:
          </span>
          <Badge className={statusInfo.color}>
            {statusInfo.text}
          </Badge>
          {product.view_count && product.view_count > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {product.view_count} просмотров
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
            Редактировать
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
                    Скрыть
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Скрыть объявление?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Объявление будет помещено в архив и не будет отображаться в поиске.
                      Вы сможете восстановить его позже.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleStatusChange('archived')}>
                      Скрыть
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
                    Продано
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
              Восстановить
            </Button>
          )}

          {product.status === 'sold' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleStatusChange('active')}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Вернуть в продажу
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerProductActions;