
import { Database } from "@/integrations/supabase/types";

export type Store = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  address: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  seller_id: string;
  rating: number;
};

export type StoreImage = {
  id: string;
  store_id: string;
  url: string;
  is_primary: boolean;
  created_at: string;
};

export type StoreReview = {
  id: string;
  store_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name?: string;
};

export type StoreWithImages = Store & {
  store_images?: StoreImage[];
};
