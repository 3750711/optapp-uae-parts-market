
import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  XCircle,
  FileText,
  MoreHorizontal,
  X,
  Clock,
  Package,
  Truck,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileBulkActionsBarProps {
  selectedOrders: string[];
  allOrders: Order[];
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkStatusChange: (status: string) => void;
  onBulkDelete: () => void;
  onExport: () => void;
}

const statusOptions = [
  { value: 'created', label: 'Создан', icon: Clock, color: 'text-blue-600', description: 'Заказ только что создан' },
  { value: 'seller_confirmed', label: 'Подтвержден продавцом', icon: CheckCircle, color: 'text-orange-600', description: 'Продавец подтвердил заказ' },
  { value: 'admin_confirmed', label: 'Подтвержден администратором', icon: CheckCircle, color: 'text-green-600', description: 'Администратор подтвердил заказ' },
  { value: 'processed', label: 'Зарегистрирован', icon: FileCheck, color: 'text-yellow-600', description: 'Заказ зарегистрирован в системе' },
  { value: 'shipped', label: 'Отправлен', icon: Truck, color: 'text-purple-600', description: 'Заказ отправлен к покупателю' },
  { value: 'delivered', label: 'Доставлен', icon: Package, color: 'text-emerald-600', description: 'Заказ успешно доставлен' },
  { value: 'cancelled', label: 'Отменен', icon: XCircle, color: 'text-red-600', description: 'Заказ отменен' },
];

export const MobileBulkActionsBar: React.FC<MobileBulkActionsBarProps> = ({
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40 safe-area-pb">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={isAllSelected ? onClearSelection : onSelectAll}
            {...(isPartiallySelected && { 'data-state': 'indeterminate' })}
          />
          <div className="flex flex-col">
            <Badge variant="secondary" className="text-xs w-fit">
              {selectedCount} из {totalCount}
            </Badge>
            <div className="text-xs text-muted-foreground">
              ${totalValue.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="default" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-1" />
                Действия
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[80vh]">
              <SheetHeader className="mb-6">
                <SheetTitle>Массовые действия</SheetTitle>
                <SheetDescription>
                  Выбрано {selectedCount} заказов на сумму ${totalValue.toLocaleString()}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Изменить статус заказов</h3>
                  {statusOptions.map((status) => {
                    const Icon = status.icon;
                    return (
                      <Button
                        key={status.value}
                        variant="outline"
                        className="w-full justify-start h-14"
                        onClick={() => onBulkStatusChange(status.value)}
                      >
                        <Icon className={`h-5 w-5 mr-3 ${status.color}`} />
                        <div className="text-left">
                          <div className="font-medium">{status.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {status.description}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12"
                    onClick={onExport}
                  >
                    <FileText className="h-5 w-5 mr-3 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Экспорт в Excel</div>
                      <div className="text-xs text-muted-foreground">
                        Скачать выбранные заказы
                      </div>
                    </div>
                  </Button>
                </div>

                <div className="pt-3 border-t">
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={onClearSelection}
                  >
                    Отменить выбор
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};
