
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle,
  FileText,
  Clock,
  Package,
  Truck,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BulkActionsBarProps {
  selectedOrders: string[];
  allOrders: Order[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkStatusChange: (status: string) => void;
  onBulkDelete: () => void;
  onExport: () => void;
}

const statusOptions = [
  { value: 'created', label: 'Создан', icon: Clock, color: 'text-blue-600' },
  { value: 'seller_confirmed', label: 'Подтвержден продавцом', icon: CheckCircle, color: 'text-orange-600' },
  { value: 'admin_confirmed', label: 'Подтвержден администратором', icon: CheckCircle, color: 'text-green-600' },
  { value: 'in_delivery', label: 'В доставке', icon: Truck, color: 'text-purple-600' },
  { value: 'delivered', label: 'Доставлен', icon: Package, color: 'text-emerald-600' },
  { value: 'cancelled', label: 'Отменен', icon: XCircle, color: 'text-red-600' },
  { value: 'rejected', label: 'Отклонен', icon: AlertCircle, color: 'text-gray-600' },
];

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedOrders,
  allOrders,
  onSelectAll,
  onClearSelection,
  onBulkStatusChange,
  onBulkDelete,
  onExport
}) => {
  const selectedCount = selectedOrders.length;
  const totalCount = allOrders.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  if (selectedCount === 0) return null;

  const selectedOrdersData = allOrders.filter(order => selectedOrders.includes(order.id));
  const totalValue = selectedOrdersData.reduce((sum, order) => sum + (order.price || 0), 0);

  return (
    <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={isAllSelected ? onClearSelection : onSelectAll}
            className="scale-110"
            {...(isPartiallySelected && { 'data-state': 'indeterminate' })}
          />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {selectedCount} из {totalCount}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Общая стоимость: <span className="font-semibold text-primary">${totalValue.toLocaleString()}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <MoreHorizontal className="h-4 w-4 mr-1" />
                Изменить статус
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {statusOptions.map((status, index) => {
                const Icon = status.icon;
                return (
                  <DropdownMenuItem
                    key={status.value}
                    onClick={() => onBulkStatusChange(status.value)}
                    className="cursor-pointer"
                  >
                    <Icon className={`h-4 w-4 mr-2 ${status.color}`} />
                    {status.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            size="sm"
            onClick={onExport}
            className="hover:bg-blue-50 hover:border-blue-300"
          >
            <FileText className="h-4 w-4 mr-1 text-blue-600" />
            Excel
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={onBulkDelete}
            className="hover:bg-red-50 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4 mr-1 text-red-600" />
            Удалить
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={onClearSelection}
            className="hover:bg-gray-50"
          >
            Отменить выбор
          </Button>
        </div>
      </div>
    </div>
  );
};
