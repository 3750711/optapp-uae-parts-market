
import { Database } from '@/integrations/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

// Extend the RPCFunctionsDatabase interface to include our new admin functions
interface CustomRPCFunctions {
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
