
import { Database } from '@/integrations/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Extend the RPCFunctionsDatabase interface to include our admin functions
interface CustomRPCFunctions {
  count_products_with_notification_issues: (args: {
    p_search?: string | null;
    p_status?: string;
    p_seller_id?: string | null;
  }) => number;

  get_products_with_notification_issues: (args: {
    p_limit?: number;
    p_offset?: number;
    p_search?: string | null;
    p_status?: string;
    p_seller_id?: string | null;
  }) => any[];

  admin_create_product: (args: {
    p_title: string;
    p_price: number;
    p_condition: string;
    p_brand: string;
    p_model: string;
    p_description: string | null;
    p_seller_id: string;
    p_seller_name: string;
    p_status: 'pending' | 'active' | 'sold' | 'archived';
    p_place_number: number;
    p_delivery_price: number | null;
  }) => string; // Returns UUID

  create_standard_product: (args: {
    p_title: string;
    p_price: number;
    p_description?: string | null;
  }) => string; // Returns UUID

  create_trusted_product: (args: {
    p_title: string;
    p_price: number;
    p_description?: string | null;
    p_condition?: string;
    p_brand?: string;
    p_model?: string | null;
    p_place_number?: number;
    p_delivery_price?: number;
  }) => string; // Returns UUID

  admin_insert_product_image: (args: {
    p_product_id: string;
    p_url: string;
    p_is_primary?: boolean;
  }) => void;

  admin_insert_product_video: (args: {
    p_product_id: string;
    p_url: string;
  }) => void;

  secure_update_profile: (args: {
    p_user_id: string;
    p_updates: Record<string, any>;
  }) => { success: boolean; message: string };

  seller_create_order: (args: {
    p_title: string;
    p_price: number;
    p_place_number: number;
    p_seller_id: string;
    p_order_seller_name: string;
    p_seller_opt_id: string;
    p_buyer_id: string;
    p_brand: string;
    p_model: string;
    p_status: 'created' | 'seller_confirmed' | 'processed' | 'cancelled';
    p_order_created_type: 'free_order' | 'product_order';
    p_telegram_url_order: string | null;
    p_images: string[];
    p_product_id: string | null;
    p_delivery_method: 'self_pickup' | 'delivery';
    p_text_order: string | null;
    p_delivery_price_confirm: number | null;
    p_videos?: string[];
  }) => string; // Returns UUID

  admin_delete_specific_user: (args: {
    p_user_email: string;
  }) => any; // Returns jsonb object

  semantic_search_products: (args: {
    query_embedding: number[];
    similarity_threshold?: number;
    match_count?: number;
  }) => any[];

  check_search_rate_limit: (args: {
    user_id: string;
  }) => boolean;

  search_car_brands_and_models: (args: {
    search_term: string;
  }) => any[];

  admin_create_order: (args: {
    p_title: string;
    p_price: number;
    p_seller_id: string;
    p_buyer_id: string;
    p_status: 'created' | 'seller_confirmed' | 'admin_confirmed' | 'processed' | 'shipped' | 'delivered' | 'cancelled';
    p_quantity: number;
    p_delivery_method: 'self_pickup' | 'cargo_rf' | 'cargo_kz';
    p_place_number: number;
    p_delivery_price_confirm: number | null;
    p_product_id: string | null;
    p_brand: string;
    p_model: string;
    p_description: string;
    p_images: string[];
    p_video_url: string[];
    p_text_order: string;
  }) => string; // Returns UUID

  resend_product_notification: (args: {
    p_product_id: string;
  }) => {
    success: boolean;
    message?: string;
    error?: string;
    response?: any;
  };
}

// Extend the built-in Database type
declare module '@supabase/supabase-js' {
  interface SupabaseClient<T> {
    rpc<FunctionName extends keyof CustomRPCFunctions>(
      fn: FunctionName,
      args?: Parameters<CustomRPCFunctions[FunctionName]>[0],
      options?: {}
    ): Promise<{ data: ReturnType<CustomRPCFunctions[FunctionName]>; error: any }>;
  }
}
