
export interface ProductProps {
  id: string;
  name: string;
  price: number;
  image: string;
  condition: "Новый" | "Б/У" | "Восстановленный";
  location: string;
  seller_opt_id?: string;
  seller_rating?: number;
  optid_created?: string;
  rating_seller?: number;
  brand: string;
  model: string;
  seller_name: string;
  seller_id: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
}

export interface ProductImage {
  url: string;
  is_primary?: boolean;
}

export interface ProductVideo {
  url: string;
}

export interface SellerProfile {
  id?: string;
  full_name?: string;
  rating?: number;
  phone?: string;
  opt_id?: string;
  telegram?: string;
  description?: string;
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
  product_videos?: ProductVideo[];
  videos?: string[];
  video_url?: string;
  profiles?: SellerProfile;
  rating_seller?: number | null;
  optid_created?: string | null;
  status: 'pending' | 'active' | 'sold' | 'archived';
}
