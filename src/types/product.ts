
export interface ProductImage {
  url: string;
  is_primary?: boolean;
}

export interface SellerProfile {
  full_name?: string;
  rating?: number;
  phone?: string;
  opt_id?: string;
  telegram?: string;
}

export interface Product {
  id: string;
  title: string;
  price: string | number;
  description?: string;
  condition: string;
  location?: string;
  brand?: string;
  model?: string;
  lot_number?: string | number;
  seller_name: string;
  telegram_url?: string;
  phone_url?: string;
  product_url?: string;
  product_images?: ProductImage[];
  profiles?: SellerProfile;
  rating_seller?: number | null;
  optid_created?: string | null;
}
