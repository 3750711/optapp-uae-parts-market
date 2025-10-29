export type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';
export type ContainerStatus = 'waiting' | 'sent_from_uae' | 'iran_transit' | 'customs' | 
  'customs_out' | 'customs_holding' | 'terminal' | 'transit_to_warehouse' | 'received' | 'delivered';
export type OrderStatus = 'created' | 'paid' | 'in_process' | 'shipped' | 'delivered' | 'cancelled';

export interface LogisticsFilters {
  // Множественный выбор
  sellerIds: string[];           // UUID продавцов
  buyerIds: string[];            // UUID покупателей
  containerNumbers: string[];    // Номера контейнеров
  
  // Статусы (множественный выбор)
  shipmentStatuses: ShipmentStatus[];     
  containerStatuses: ContainerStatus[];   
  orderStatuses: OrderStatus[];           
  
  // Текстовый поиск
  searchTerm: string;             // Поиск по номеру/названию
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
