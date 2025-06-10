
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2, Archive, CheckCircle, Clock } from "lucide-react";

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
  if (selectedCount === 0) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Выбрано товаров: {selectedCount}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange('pending')}
            className="flex items-center gap-1"
          >
            <Clock className="h-4 w-4" />
            На проверку
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange('active')}
            className="flex items-center gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            Активировать
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStatusChange('archived')}
            className="flex items-center gap-1"
          >
            <Archive className="h-4 w-4" />
            В архив
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            Удалить
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            Отменить выбор
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectedProductsActions;
