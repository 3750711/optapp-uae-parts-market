
export interface OrderFormData {
  title: string;
  price: string;
  buyerOptId: string;
  brand: string;
  model: string;
  brandId: string;
  modelId: string;
  sellerId: string;
  deliveryMethod: 'self_pickup' | 'delivery' | 'cargo_rf';
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
