
import { Database } from "@/integrations/supabase/types";

export type UserType = 'buyer' | 'seller' | 'admin';

export type ProfileType = Database["public"]["Tables"]["profiles"]["Row"] & {
  user_type: UserType;
  is_trusted_seller?: boolean;
};
