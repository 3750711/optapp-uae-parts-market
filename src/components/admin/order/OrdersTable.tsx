import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Order } from '@/hooks/useOptimizedOrdersQuery';
// Remove formatCurrency import since it doesn't exist
import { format } from 'date-fns';

interface OrdersTableProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectOrder: (orderId: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
  onViewDetails: (orderId: string) => void;
  onQuickAction?: (orderId: string, action: string) => void;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'created':
      return 'secondary';
    case 'seller_confirmed':
      return 'outline';
    case 'admin_confirmed':
      return 'default';
    case 'processed':
      return 'default';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'created':
      return 'Создан';
    case 'seller_confirmed':
      return 'Подтверждён продавцом';
    case 'admin_confirmed':
      return 'Подтверждён админом';
    case 'processed':
      return 'Обработан';
    case 'cancelled':
      return 'Отменён';
    default:
      return status;
  }
};

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  selectedOrders,
  onSelectOrder,
  onEdit,
  onDelete,
  onViewDetails,
  onQuickAction
}) => {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      orders.forEach(order => {
        if (!selectedOrders.includes(order.id)) {
          onSelectOrder(order.id);
        }
      });
    } else {
      selectedOrders.forEach(orderId => onSelectOrder(orderId));
    }
  };

  const isAllSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const isIndeterminate = selectedOrders.length > 0 && selectedOrders.length < orders.length;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Номер заказа</TableHead>
            <TableHead>Товар</TableHead>
            <TableHead>Покупатель</TableHead>
            <TableHead>Продавец</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Дата создания</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={() => onSelectOrder(order.id)}
                />
              </TableCell>
              <TableCell className="font-medium">
                {order.order_number || `#${order.id.slice(0, 8)}`}
              </TableCell>
              <TableCell className="max-w-48 truncate">
                {order.title || 'Без названия'}
              </TableCell>
              <TableCell>
                {order.buyer?.full_name || order.buyer?.telegram || 'Не указан'}
              </TableCell>
              <TableCell>
                {order.seller?.full_name || order.seller?.telegram || 'Не указан'}
              </TableCell>
              <TableCell>
                {order.price ? `₽${order.price.toLocaleString()}` : 'Не указана'}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(order.status)}>
                  {getStatusLabel(order.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {order.created_at ? format(new Date(order.created_at), 'dd.MM.yyyy HH:mm') : '—'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewDetails(order.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Просмотр
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(order)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                    {onQuickAction && order.status === 'created' && (
                      <DropdownMenuItem onClick={() => onQuickAction(order.id, 'confirm')}>
                        Подтвердить
                      </DropdownMenuItem>
                    )}
                    {onQuickAction && order.status === 'admin_confirmed' && (
                      <DropdownMenuItem onClick={() => onQuickAction(order.id, 'register')}>
                        Зарегистрировать
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(order)} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};