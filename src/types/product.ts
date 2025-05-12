
export interface ProductProps {
  id: string;
  name: string;
  price: number;
  image: string;
  preview_image?: string;  // Added for preview image
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
  seller_verification?: 'pending' | 'verified' | 'blocked';
  created_at?: string;
  seller_opt_status?: 'free_user' | 'opt_user';
  onStatusChange?: () => void;
  delivery_price?: number | null;
  has_preview?: boolean;  // Added to indicate if the product has preview images
}

export interface ProductImage {
  url: string;
  is_primary?: boolean;
  preview_url?: string; // Added for storing the preview image URL
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
  description_user?: string;
  location?: string;
  opt_status?: 'free_user' | 'opt_user';
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  price: string | number;
  description?: string;
  location?: string;
  product_location?: string;
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
  created_at: string;
  updated_at?: string;
  place_number?: number | null;
  delivery_price?: number | null;
  hasPreviewImage?: boolean; // Added to indicate if the product has preview images
}
