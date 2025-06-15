
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, Archive } from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SelectedProductsActionsProps {
  selectedCount: number;
  onStatusChange: (status: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onClearSelection: () => void;
}

const SelectedProductsActions: React.FC<SelectedProductsActionsProps> = ({
  selectedCount,
  onStatusChange,
  onDelete,
  onClearSelection
}) => {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (status: string) => {
    setIsChangingStatus(true);
    await onStatusChange(status);
    setIsChangingStatus(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-2 z-20 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm text-primary-foreground">
          Выбрано: {selectedCount}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isChangingStatus}>
              Изменить статус
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleStatusChange('active')}>
              <CheckCircle className="mr-2 h-4 w-4" /> Опубликовать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
              <Archive className="mr-2 h-4 w-4" /> В архив
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" /> Удалить
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить выбранные товары?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы уверены, что хотите удалить {selectedCount} товар(а)? Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          Снять выделение
        </Button>
      </div>
    </div>
  );
};

export default SelectedProductsActions;
