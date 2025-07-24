
import { ProfileType } from '@/components/profile/types';

export interface UserFormValues {
  full_name?: string;
  company_name?: string;
  phone?: string;
  telegram?: string;
  opt_id?: string;
  user_type: "buyer" | "seller" | "admin";
  verification_status: "pending" | "verified" | "blocked";
  communication_ability?: number;
  rating?: string;
  is_trusted_seller?: boolean;
}

export interface UserEditDialogProps {
  user: ProfileType;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export interface UserEditFormProps {
  user: ProfileType;
  onSubmit: (values: UserFormValues) => Promise<void>;
  isSubmitting: boolean;
  onClose: () => void;
}
