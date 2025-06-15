
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  UserCheck, 
  Ban, 
  UserX, 
  Download, 
  Trash2,
  X 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkUserActionsProps {
  selectedUsers: string[];
  totalUsers: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkAction: (action: string) => void;
  onExport: () => void;
}

export const BulkUserActions: React.FC<BulkUserActionsProps> = ({
  selectedUsers,
  totalUsers,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  onExport
}) => {
  const selectedCount = selectedUsers.length;
  const isAllSelected = selectedCount === totalUsers && totalUsers > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalUsers;

  if (selectedCount === 0) return null;

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4 mb-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={isAllSelected ? onClearSelection : onSelectAll}
            className="scale-110"
            {...(isPartiallySelected && { 'data-state': 'indeterminate' })}
          />
          <Badge variant="secondary" className="text-sm">
            {selectedCount} из {totalUsers} выбрано
          </Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <UserCheck className="h-4 w-4 mr-1" />
                Действия
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onBulkAction('verify')}>
                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                Подтвердить
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('block')}>
                <Ban className="mr-2 h-4 w-4 text-red-600" />
                Заблокировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction('pending')}>
                <UserX className="mr-2 h-4 w-4 text-orange-600" />
                Сбросить статус
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
          >
            <Download className="h-4 w-4 mr-1" />
            Экспорт
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4 mr-1" />
            Отменить
          </Button>
        </div>
      </div>
    </div>
  );
};
