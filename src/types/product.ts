
export interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  condition?: string;
  description?: string;
  seller_name: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  seller_id: string;
  created_at?: string;
  delivery_price?: number | null;
  optid_created?: string | null;
  cloudinary_public_id?: string | null;
  cloudinary_url?: string | null;
  rating_seller?: number | null;
  product_images?: Array<{ url: string; is_primary?: boolean }>;
  last_notification_sent_at?: string | null; // Add field for repost functionality
  
  // Недостающие поля для корректной работы
  lot_number?: number;
  place_number?: number;
  product_location?: string;
  view_count?: number;
  phone_url?: string;
  telegram_url?: string;
  product_videos?: Array<{ url: string }>;
  location?: string;
  image?: string;
  
  // Связанные данные (для JOIN запросов)
  profiles?: {
    full_name?: string;
    rating?: number;
    opt_id?: string;
    opt_status?: string;
    description_user?: string;
    telegram?: string;
    phone?: string;
    location?: string;
    avatar_url?: string;
    communication_ability?: number;
  };
  
  // Optimization fields for offers
  has_active_offers?: boolean;
  max_offer_price?: number | null;
  offers_count?: number;
  
  // TG views estimate (only for sellers/admins)
  tg_views_estimate?: number;
  
  // Frozen TG views for sold products
  tg_views_frozen?: number;
  
  // Catalog position for sorting
  catalog_position?: string;
}

export interface SellerProfile {
  id: string;
  full_name?: string;
  rating?: number;
  opt_id?: string;
  opt_status?: string;
  description_user?: string;
  telegram?: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  communication_ability?: number;
}
