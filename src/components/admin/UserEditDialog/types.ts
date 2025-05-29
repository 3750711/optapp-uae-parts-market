
import { Database } from '@/integrations/supabase/types';

export type UserFormValues = {
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  telegram: string | null;
  opt_id: string | null;
  user_type: 'buyer' | 'seller' | 'admin';
  verification_status: 'pending' | 'verified' | 'blocked';
};

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface UserEditDialogProps {
  user: Profile | null;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export interface UserEditFormProps {
  user: Profile;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isSubmitting: boolean;
  onClose: () => void;
}
