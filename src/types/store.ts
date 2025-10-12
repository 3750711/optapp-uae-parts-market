
import { Database } from "@/integrations/supabase/types";

export type Store = Database['public']['Tables']['stores']['Row'] & {
  whatsapp?: string;
};
export type StoreInsert = Database['public']['Tables']['stores']['Insert'];
export type StoreUpdate = Database['public']['Tables']['stores']['Update'];

export type StoreImage = Database['public']['Tables']['store_images']['Row'];
export type StoreImageInsert = Database['public']['Tables']['store_images']['Insert'];

export type StoreReview = Database['public']['Tables']['store_reviews']['Row'] & {
  user_name?: string;
  user_avatar?: string;
};

export type StoreWithImages = Store & {
  store_images: StoreImage[];
};

export type StoreTag = Database['public']['Enums']['store_tag'];
