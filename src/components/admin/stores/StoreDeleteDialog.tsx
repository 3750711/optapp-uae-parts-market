
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type StoreWithDetails = {
  id: string;
  name: string;
};

interface StoreDeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreWithDetails | null;
  onConfirm: () => void;
  isDeleting: boolean;
  isAdmin: boolean;
}

const StoreDeleteDialog: React.FC<StoreDeleteDialogProps> = ({
  isOpen,
  onOpenChange,
  store,
  onConfirm,
  isDeleting,
  isAdmin
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Удалить магазин
          </AlertDialogTitle>
          <AlertDialogDescription>
            Вы уверены, что хотите удалить магазин "{store?.name}"? Это действие нельзя отменить.
            Также будут удалены все связанные с магазином данные: изображения, отзывы и связи с марками и моделями автомобилей.
            
            {isDeleting && (
              <div className="mt-2 text-sm text-blue-600">
                Выполняется удаление, пожалуйста подождите...
              </div>
            )}
            
            {!isAdmin && (
              <div className="mt-2 text-sm text-red-600">
                ⚠️ У вас недостаточно прав для удаления магазинов
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-destructive hover:bg-destructive/90"
            disabled={isDeleting || !isAdmin}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default StoreDeleteDialog;
