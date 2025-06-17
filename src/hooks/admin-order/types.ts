
export interface BuyerProfile {
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

export interface CreatedOrder {
  id: string;
  order_number: number;
  title: string;
  price: number;
  status: string;
  created_at: string;
  buyer_id: string;
  seller_id: string;
  images?: string[];
  video_url?: string[];
}

export interface CarBrand {
  id: string;
  name: string;
}

export interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface InitializationState {
  isInitializing: boolean;
  error: string | null;
  stage: string;
  progress: number;
}

export interface SubmissionState {
  isLoading: boolean;
  stage: string;
  progress: number;
}
