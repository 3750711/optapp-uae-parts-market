
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
}

export interface ProfileShort {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

export interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

export interface BrandData {
  id: string;
  name: string;
}

export interface ModelData {
  id: string;
  name: string;
  brand_id: string;
}

export type DeliveryMethod = 'self_pickup' | 'cargo_rf' | 'cargo_kz';

// Updated order status type to match database enum
export type OrderStatus = 'created' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'declined';

export interface CreatedOrderProps {
  order: any;
  images: string[];
  onBack: () => void;
  onNewOrder: () => void;
  onOrderUpdate: (order: any) => void;
}
