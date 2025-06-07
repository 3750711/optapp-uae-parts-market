
import * as z from "zod";

export const userFormSchema = z.object({
  full_name: z.string().optional(),
  company_name: z.string().optional(),
  phone: z.string().optional(),
  telegram: z.string().optional(),
  opt_id: z.string().optional(),
  user_type: z.enum(["buyer", "seller", "admin"]),
  verification_status: z.enum(["pending", "verified", "blocked"]),
  communication_ability: z.number().min(1).max(5).optional(),
  rating: z.string().refine(
    (val) => {
      if (!val) return true; // Allow empty
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 5;
    },
    { message: "Рейтинг должен быть от 0 до 5" }
  ).optional(),
});
