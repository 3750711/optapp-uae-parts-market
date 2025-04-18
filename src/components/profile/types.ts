
import { Database } from "@/integrations/supabase/types";

export type UserType = 'buyer' | 'seller';

export type ProfileType = Database["public"]["Tables"]["profiles"]["Row"] & {
  user_type: UserType;
};
