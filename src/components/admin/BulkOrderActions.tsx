
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Trash2, Download, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkOrderActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onBulkConfirm: (ids: string[]) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkExport: (ids: string[]) => void;
  isLoading?: boolean;
}

export const BulkOrderActions: React.FC<BulkOrderActionsProps> = ({
  selectedIds,
  onClearSelection,
  onBulkConfirm,
  onBulkDelete,
  onBulkExport,
  isLoading = false
}) => {
  if (selectedIds.length === 0) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4">
      <Badge variant="secondary" className="bg-primary/10">
        Выбрано: {selectedIds.length}
      </Badge>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isLoading}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Массовые действия
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onBulkConfirm(selectedIds)}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Подтвердить выбранные
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onBulkExport(selectedIds)}>
              <Download className="h-4 w-4 mr-2" />
              Экспорт в Excel
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onBulkDelete(selectedIds)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить выбранные
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Отменить выбор
        </Button>
      </div>
    </div>
  );
};
