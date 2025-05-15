
import { ProfileType } from '@/components/profile/types';
import { z } from "zod";
import { userFormSchema } from "./schema";

export type UserFormValues = z.infer<typeof userFormSchema>;

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
