
import { z } from "zod";

export const userFormSchema = z.object({
  full_name: z.string().nullable(),
  company_name: z.string().nullable(),
  phone: z.string().nullable(),
  telegram: z.string().nullable(),
  opt_id: z.string().nullable(),
  user_type: z.enum(['buyer', 'seller', 'admin']),
  verification_status: z.enum(['pending', 'verified', 'blocked']),
  communication_ability: z.number().min(1).max(5).nullable(),
});
