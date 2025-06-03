
import React from 'react';
import { Button } from "@/components/ui/button";
import OrderCard from './OrderCard';
import { OrderSearchResult } from '@/hooks/useOrdersSearch';

interface OrdersListProps {
  orders: OrderSearchResult[];
  isSeller: boolean;
  hasActiveSearch: boolean;
  searchTerm: string;
  onClearSearch: () => void;
  onNavigateToCatalog: () => void;
}

const OrdersList: React.FC<OrdersListProps> = ({
  orders,
  isSeller,
  hasActiveSearch,
  searchTerm,
  onClearSearch,
  onNavigateToCatalog
}) => {
  if (orders && orders.length > 0) {
    return (
      <div className="space-y-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isSeller={isSeller}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="text-center py-8">
      {hasActiveSearch ? (
        <>
          <p className="text-gray-500 mb-4">По вашему запросу "{searchTerm}" ничего не найдено</p>
          <Button
            variant="outline"
            onClick={onClearSearch}
            className="mr-4"
          >
            Очистить поиск
          </Button>
        </>
      ) : (
        <>
          <p className="text-gray-500">У вас пока нет заказов</p>
          <Button
            className="mt-4 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
            onClick={onNavigateToCatalog}
          >
            Перейти в каталог
          </Button>
        </>
      )}
    </div>
  );
};

export default OrdersList;
