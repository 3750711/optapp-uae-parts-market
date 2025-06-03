
import { useState, useMemo } from 'react';
import { useDebounceSearch } from '@/hooks/useDebounceSearch';

export interface OrderSearchResult {
  id: string;
  order_number: number;
  title: string;
  brand: string;
  model: string;
  price: number;
  status: string;
  created_at: string;
  order_seller_name: string;
  seller_opt_id?: string;
  lot_number_order?: number;
  buyer_opt_id?: string;
  hasConfirmImages?: boolean;
  place_number?: number;
  delivery_price_confirm?: number;
  order_created_type?: string;
  text_order?: string;
  delivery_method?: string;
  products?: {
    lot_number: string;
  };
  seller?: {
    phone: string | null;
    telegram: string | null;
    opt_id: string | null;
  };
}

export const useOrdersSearch = (orders: OrderSearchResult[], searchTerm: string) => {
  const debouncedSearchTerm = useDebounceSearch(searchTerm, 300);

  const filteredOrders = useMemo(() => {
    if (!debouncedSearchTerm || !orders) {
      return orders;
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    
    return orders.filter((order) => {
      // Поиск по номеру заказа
      if (order.order_number?.toString().includes(searchLower)) {
        return true;
      }

      // Поиск по номеру лота из продукта
      if (order.products?.lot_number?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Поиск по номеру лота в заказе
      if (order.lot_number_order?.toString().includes(searchLower)) {
        return true;
      }

      // Поиск по наименованию (title)
      if (order.title?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Поиск по бренду
      if (order.brand?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Поиск по модели
      if (order.model?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Поиск по opt_id продавца из профиля
      if (order.seller?.opt_id?.toLowerCase().includes(searchLower)) {
        return true;
      }

      // Поиск по opt_id продавца из заказа (seller_opt_id)
      if (order.seller_opt_id?.toLowerCase().includes(searchLower)) {
        return true;
      }

      return false;
    });
  }, [orders, debouncedSearchTerm]);

  return {
    filteredOrders,
    searchTerm: debouncedSearchTerm,
    hasActiveSearch: !!debouncedSearchTerm
  };
};
