
import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface SelectedProductsActionsProps {
  selectedProducts: string[];
  onDeleteSelected: () => void;
  isDeleting: boolean;
  onToggleAllSelected: (selected: boolean) => void;
}

const SelectedProductsActions: React.FC<SelectedProductsActionsProps> = ({
  selectedProducts,
  onDeleteSelected,
  isDeleting,
  onToggleAllSelected
}) => {
  if (selectedProducts.length === 0) return null;

  return (
    <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <input 
          type="checkbox" 
          checked={selectedProducts.length > 0} 
          onChange={(e) => onToggleAllSelected(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300"
        />
        <span className="text-sm font-medium">
          Выбрано товаров: {selectedProducts.length}
        </span>
      </div>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={onDeleteSelected}
          disabled={isDeleting}
          className="flex items-center gap-1"
        >
          <Trash2 className="h-4 w-4" />
          <span>Удалить выбранные</span>
        </Button>
      </div>
    </div>
  );
};

export default SelectedProductsActions;
