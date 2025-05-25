
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  Trash2, 
  CheckCircle, 
  XCircle,
  FileText 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/hooks/useOptimizedOrdersQuery';

interface BulkActionsBarProps {
  selectedOrders: string[];
  allOrders: Order[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkStatusChange: (status: string) => void;
  onBulkDelete: () => void;
  onExport: () => void;
}

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
            ref={(el) => {
              if (el) el.indeterminate = isPartiallySelected;
            }}
            onCheckedChange={isAllSelected ? onClearSelection : onSelectAll}
            className="scale-110"
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
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onBulkStatusChange('admin_confirmed')}
            className="hover:bg-green-50 hover:border-green-300"
          >
            <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
            Подтвердить
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onBulkStatusChange('cancelled')}
            className="hover:bg-red-50 hover:border-red-300"
          >
            <XCircle className="h-4 w-4 mr-1 text-red-600" />
            Отменить
          </Button>

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
