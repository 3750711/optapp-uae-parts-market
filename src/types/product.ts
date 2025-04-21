
export interface ProductImage {
  url: string;
  is_primary?: boolean;
}

export interface ProductVideo {
  url: string;
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
  seller_id: string;
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
  product_videos?: ProductVideo[];  // Added this property
  videos?: string[];                // Added this property as fallback
  video_url?: string;               // Added this property as fallback
  profiles?: SellerProfile;
  rating_seller?: number | null;
  optid_created?: string | null;
  status: 'pending' | 'active' | 'sold' | 'archived';
}
