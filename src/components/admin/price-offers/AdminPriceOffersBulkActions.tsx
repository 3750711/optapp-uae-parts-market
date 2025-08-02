import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, X, Check, Clock } from "lucide-react";
import { useUpdatePriceOffer, useDeletePriceOffer } from "@/hooks/use-price-offers";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface AdminPriceOffersBulkActionsProps {
  selectedOfferIds: string[];
  onClearSelection: () => void;
  onBulkUpdate: () => void;
}

export const AdminPriceOffersBulkActions: React.FC<AdminPriceOffersBulkActionsProps> = ({
  selectedOfferIds,
  onClearSelection,
  onBulkUpdate
}) => {
  const updateOffer = useUpdatePriceOffer();
  const deleteOffer = useDeletePriceOffer();

  const handleBulkAction = async (action: 'cancel' | 'expire') => {
    try {
      const promises = selectedOfferIds.map(id =>
        updateOffer.mutateAsync({
          offerId: id,
          data: { 
            status: action === 'cancel' ? 'cancelled' : 'expired' 
          }
        })
      );

      await Promise.all(promises);
      
      toast({
        title: "Операция выполнена",
        description: `${selectedOfferIds.length} предложений обновлено`,
      });
      
      onBulkUpdate();
      onClearSelection();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить операцию",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = selectedOfferIds.map(id => 
        deleteOffer.mutateAsync(id)
      );
      
      await Promise.all(promises);
      
      toast({
        title: "Успешно",
        description: `${selectedOfferIds.length} предложений удалено`,
      });
      
      onClearSelection();
      onBulkUpdate();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить предложения",
        variant: "destructive",
      });
    }
  };

  if (selectedOfferIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{selectedOfferIds.length} выбрано</Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4 mr-1" />
          Очистить
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('cancel')}
          disabled={updateOffer.isPending}
        >
          <X className="h-4 w-4 mr-1" />
          Отменить
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('expire')}
          disabled={updateOffer.isPending}
        >
          <Clock className="h-4 w-4 mr-1" />
          Пометить истекшими
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
              disabled={deleteOffer.isPending}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Удалить
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить выбранные предложения?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. {selectedOfferIds.length} предложений будет удалено навсегда.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleBulkDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Удалить все
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};