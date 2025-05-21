
export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  is_primary: boolean;
  preview_url?: string | null;
}

export interface ProductVideo {
  id: string;
  product_id: string;
  url: string;
}

export interface SellerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  rating: number | null;
  opt_id: string | null;
  opt_status?: string | null;
  description_user?: string | null;
  telegram?: string | null;
  phone?: string | null;
  location?: string | null;
}

export type ProductStatus = 'pending' | 'active' | 'sold' | 'archived';

export interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  brand: string;
  model: string | null;
  description?: string | null;
  seller_id: string;
  seller_name: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  created_at: string;
  updated_at: string;
  place_number?: number | null;
  delivery_price?: number | null;
  has_preview?: boolean | null;
  telegram_url?: string | null;
  phone_url?: string | null;
  product_url?: string | null;
  optid_created?: string | null;
  product_location?: string | null;
  rating_seller?: number | null;
  lot_number?: number;
  location?: string | null;
  last_notification_sent_at?: string | null;
  
  // Joined relationships
  product_images?: ProductImage[];
  product_videos?: ProductVideo[];
  profiles?: SellerProfile;
}

export interface ActionLog {
  id: string;
  created_at: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  user_id: string;
  details: object;
}
