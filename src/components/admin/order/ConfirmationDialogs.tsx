
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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Order } from '@/hooks/useOptimizedOrdersQuery';
import { Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

interface BulkDeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalValue: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const BulkDeleteConfirmation: React.FC<BulkDeleteConfirmationProps> = ({
  open,
  onOpenChange,
  selectedCount,
  totalValue,
  onConfirm,
  isLoading = false
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-red-900">
              Подтвердите удаление заказов
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">Внимание!</span>
              </div>
              <p className="text-red-800">
                Это действие нельзя отменить. Будут удалены все связанные данные.
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Количество заказов:</span>
                <Badge variant="destructive">{selectedCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Общая стоимость:</span>
                <Badge variant="outline">${totalValue.toLocaleString()}</Badge>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Удаление...' : 'Удалить заказы'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface BulkStatusChangeConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  newStatus: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const BulkStatusChangeConfirmation: React.FC<BulkStatusChangeConfirmationProps> = ({
  open,
  onOpenChange,
  selectedCount,
  newStatus,
  onConfirm,
  isLoading = false
}) => {
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'admin_confirmed': 'Подтвержден администратором',
      'processed': 'Зарегистрирован',
      'shipped': 'Отправлен',
      'delivered': 'Доставлен',
      'cancelled': 'Отменен'
    };
    return statusLabels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const isCritical = status === 'cancelled';
    return isCritical ? 'destructive' : 'default';
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <CheckCircle className="h-5 w-5 text-blue-600" />
            </div>
            <AlertDialogTitle>
              Подтвердите изменение статуса
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <p>
              Статус будет изменен для <strong>{selectedCount}</strong> заказов.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span>Новый статус:</span>
                <Badge variant={getStatusColor(newStatus)}>
                  {getStatusLabel(newStatus)}
                </Badge>
              </div>
            </div>

            {newStatus === 'cancelled' && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Отмена заказов отправит уведомления всем участникам
                  </span>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={getStatusColor(newStatus) === 'destructive' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isLoading ? 'Обновление...' : 'Изменить статус'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface SingleOrderDeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const SingleOrderDeleteConfirmation: React.FC<SingleOrderDeleteConfirmationProps> = ({
  open,
  onOpenChange,
  order,
  onConfirm,
  isLoading = false
}) => {
  if (!order) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-red-900">
              Удалить заказ №{order.order_number}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-800">
                Заказ будет удален безвозвратно. Все связанные данные и файлы также будут удалены.
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div><strong>Товар:</strong> {order.title || 'Без названия'}</div>
              <div><strong>Продавец:</strong> {order.seller?.full_name || 'Не указан'}</div>
              <div><strong>Покупатель:</strong> {order.buyer?.full_name || 'Не указан'}</div>
              <div><strong>Стоимость:</strong> ${order.price?.toLocaleString() || '0'}</div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Удаление...' : 'Удалить заказ'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
