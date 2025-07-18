export type PriceOfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface PriceOffer {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  original_price: number;
  offered_price: number;
  status: PriceOfferStatus;
  message?: string;
  seller_response?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  order_id?: string;
  
  // Joined data
  product?: {
    id: string;
    title: string;
    brand: string;
    model: string;
    status: string;
    seller_name: string;
    product_images?: Array<{ url: string; is_primary?: boolean }>;
  };
  buyer_profile?: {
    id: string;
    full_name: string;
    opt_id: string;
    telegram?: string;
  };
  seller_profile?: {
    id: string;
    full_name: string;
    opt_id: string;
    telegram?: string;
  };
}

export interface CreatePriceOfferData {
  product_id: string;
  seller_id: string;
  original_price: number;
  offered_price: number;
  message?: string;
}

export interface UpdatePriceOfferData {
  status?: PriceOfferStatus;
  seller_response?: string;
}