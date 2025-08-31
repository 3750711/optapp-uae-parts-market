
// Унифицированные типы для системы заказов

export interface BaseProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

export interface BuyerProfile extends BaseProfile {
  user_type: 'buyer';
}

export interface SellerProfile extends BaseProfile {
  user_type: 'seller';
}

export type ProfileShort = BaseProfile;

export interface CarBrand {
  id: string;
  name: string;
}

export interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

export type DeliveryMethod = 'self_pickup' | 'cargo_rf' | 'cargo_kz';
export type OrderStatus = 'created' | 'seller_confirmed' | 'admin_confirmed' | 'processed' | 'shipped' | 'delivered' | 'cancelled';
export type OrderCreatedType = 'free_order' | 'product_order';
// Order-level status can be calculated as partially_shipped
// Individual shipment status can only be not_shipped or in_transit  
export type ShipmentStatus = 'not_shipped' | 'partially_shipped' | 'in_transit';
export type IndividualShipmentStatus = 'not_shipped' | 'in_transit';

export interface OrderFormData {
  title: string;
  price: string;
  buyerOptId: string;
  brand: string;
  model: string;
  brandId: string;
  modelId: string;
  sellerId: string;
  deliveryMethod: DeliveryMethod;
  place_number: string;
  text_order: string;
  delivery_price: string;
  description: string; // Добавляем описание
  status: OrderStatus; // Добавляем статус заказа для админов
}

export interface CreatedOrder {
  id: string;
  order_number: number; // Важно: это число, не строка
  title: string;
  price: number;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  buyer_id: string;
  seller_id: string;
  buyer_opt_id?: string;
  seller_opt_id?: string;
  order_seller_name?: string;
  telegram_url_buyer?: string;
  telegram_url_order?: string;
  brand?: string;
  model?: string;
  delivery_method: DeliveryMethod;
  place_number: number;
  text_order?: string;
  delivery_price_confirm?: number;
  images?: string[];
  video_url?: string[];
  order_created_type: OrderCreatedType;
  shipment_status: ShipmentStatus;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Вспомогательные функции для безопасной работы с полями заказа
export const getOrderNumberSafe = (order: CreatedOrder | any): string => {
  if (!order?.order_number) return 'Не указан';
  return order.order_number.toString();
};

export const getOrderNumberFormatted = (order: CreatedOrder | any): string => {
  return getOrderNumberSafe(order).toUpperCase();
};
