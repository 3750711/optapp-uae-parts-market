
import { Database } from "@/integrations/supabase/types";

export type ProfileType = Database["public"]["Tables"]["profiles"]["Row"];
