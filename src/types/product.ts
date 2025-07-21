
export interface Product {
  id: string;
  title: string;
  price: number | string;
  brand?: string;
  model?: string;
  condition?: string;
  seller_name: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  seller_id: string;
  created_at: string;
  delivery_price?: number | null;
  optid_created?: string | null;
  cloudinary_public_id?: string | null;
  cloudinary_url?: string | null;
  rating_seller?: number | null;
  product_images?: Array<{ url: string; is_primary?: boolean }>;
  
  // Optimization fields for offers
  has_active_offers?: boolean;
  max_offer_price?: number | null;
  offers_count?: number;
}
