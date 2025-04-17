
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
  lot_number?: string;
  seller_name: string;
  product_images?: ProductImage[];
  profiles?: SellerProfile;
}
