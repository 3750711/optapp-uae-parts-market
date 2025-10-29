export type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';
export type ContainerStatus = 'waiting' | 'sent_from_uae' | 'iran_transit' | 'customs' | 
  'customs_out' | 'customs_holding' | 'terminal' | 'transit_to_warehouse' | 'received' | 'delivered';
export type OrderStatus = 'created' | 'paid' | 'in_process' | 'shipped' | 'delivered' | 'cancelled';

export interface LogisticsFilters {
  sellerIds: string[];
  buyerIds: string[];
  containerNumbers: string[];
  shipmentStatuses: ShipmentStatus[];
  containerStatuses: ContainerStatus[];
  orderStatuses: OrderStatus[];
  searchTerm: string;
}

// Состояние фильтров с pending/applied для кнопки "Применить"
export interface LogisticsFiltersState {
  pending: LogisticsFilters;   // То, что пользователь выбирает
  applied: LogisticsFilters;   // То, что применено к запросу
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;  // Кол-во заказов с этим значением
}

export interface FilterStats {
  totalOrders: number;
  filteredOrders: number;
  notShipped: number;
  partiallyShipped: number;
  inTransit: number;
  totalDeliveryPrice: number;
}
