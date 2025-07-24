
import React, { useState } from 'react';
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderEditHeaderProps {
  order: any;
  onStatusChange?: (orderId: string, newStatus: string) => Promise<void>;
}

export const OrderEditHeader: React.FC<OrderEditHeaderProps> = ({ order, onStatusChange }) => {
  const isMobile = useIsMobile();
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processed':
        return 'bg-purple-100 text-purple-800';
      case 'admin_confirmed':
        return 'bg-indigo-100 text-indigo-800';
      case 'seller_confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created':
        return 'Создан';
      case 'seller_confirmed':
        return 'Подтвержден продавцом';
      case 'admin_confirmed':
        return 'Подтвержден администратором';
      case 'processed':
        return 'Зарегистрирован';
      case 'shipped':
        return 'Отправлен';
      case 'delivered':
        return 'Доставлен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!onStatusChange || !order?.id || newStatus === order.status) return;
    
    setIsChangingStatus(true);
    try {
      await onStatusChange(order.id, newStatus);
    } catch (error) {
      console.error('Error changing status:', error);
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <DialogHeader className="px-4 md:px-6 py-4 border-b bg-white">
      <div className={`flex items-center ${isMobile ? 'flex-col gap-2' : 'justify-between'}`}>
        <DialogTitle className={`${isMobile ? 'text-lg text-center' : 'text-xl'}`}>
          Редактирование заказа № {order?.order_number}
        </DialogTitle>
        
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-col' : 'flex-row'}`}>
          <Badge className={`${getStatusColor(order?.status)} ${isMobile ? 'text-xs px-2 py-1' : ''}`}>
            {getStatusText(order?.status)}
          </Badge>
          
          {onStatusChange && (
            <Select
              value={order?.status}
              onValueChange={handleStatusChange}
              disabled={isChangingStatus}
            >
              <SelectTrigger className={`${isMobile ? 'w-full text-xs' : 'w-[200px]'} h-8`}>
                <SelectValue placeholder="Изменить статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Создан</SelectItem>
                <SelectItem value="seller_confirmed">Подтвержден продавцом</SelectItem>
                <SelectItem value="admin_confirmed">Подтвержден администратором</SelectItem>
                <SelectItem value="processed">Зарегистрирован</SelectItem>
                <SelectItem value="shipped">Отправлен</SelectItem>
                <SelectItem value="delivered">Доставлен</SelectItem>
                <SelectItem value="cancelled">Отменен</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </DialogHeader>
  );
};
