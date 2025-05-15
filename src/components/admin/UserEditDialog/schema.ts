
import * as z from "zod";

export const userFormSchema = z.object({
  full_name: z.string().min(2, "Минимум 2 символа").optional(),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  telegram: z.string()
    .optional()
    .refine((value) => {
      if (!value) return true;
      return /^@[^@]+$/.test(value);
    }, { message: "Telegram должен начинаться с @" }),
  opt_id: z.string().optional(),
  user_type: z.enum(["buyer", "seller", "admin"]),
  verification_status: z.enum(["verified", "pending", "blocked"]),
});
