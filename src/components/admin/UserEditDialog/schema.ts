import * as z from "zod";
import { supabase } from '@/integrations/supabase/client';
import { ProfileType } from "@/components/profile/types";
import { allowedLocalesFor } from "@/utils/languageVisibility";

// Мы используем часть ProfileType, чтобы гарантировать наличие нужных полей
type OriginalUser = Pick<ProfileType, 'id' | 'opt_id'>;

export const createUserFormSchema = (originalUser: OriginalUser) => z.object({
  full_name: z.string().min(2, "Имя должно содержать не менее 2 символов.").optional().or(z.literal('')),
  company_name: z.string().optional().or(z.literal('')),
  phone: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
        if (!val) return true;
        // Простая валидация для телефонных номеров
        return /^\+?[0-9\s-()]+$/.test(val);
    }, {
      message: "Некорректный формат телефона.",
    }),
  telegram: z.string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
        if (!val) return true;
        return /^@[a-zA-Z0-9_]{5,32}$/.test(val);
    }, {
      message: "Некорректный формат Telegram. Пример: @username (5-32 символа)",
    }),
  opt_id: z.string().optional().or(z.literal('')),
  user_type: z.enum(["buyer", "seller", "admin"]),
  verification_status: z.enum(["pending", "verified", "blocked"]),
  communication_ability: z.number().min(1).max(5).optional(),
  rating: z.string().refine(
    (val) => {
      if (!val || val === "") return true; // Разрешаем пустое значение
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 5;
    },
    { message: "Рейтинг должен быть от 0 до 5" }
  ).optional().or(z.literal('')),
  is_trusted_seller: z.boolean().optional(),
  preferred_locale: z.enum(["ru", "en", "bn"]).optional(),
}).refine((data) => {
    // Validate that preferred_locale is allowed for the user_type
    if (data.preferred_locale && data.user_type) {
        const allowedLanguages = allowedLocalesFor(data.user_type, "/");
        if (!allowedLanguages.includes(data.preferred_locale)) {
            return false;
        }
    }
    return true;
}, {
    message: "Выбранный язык недоступен для данного типа пользователя",
    path: ["preferred_locale"],
}).refine(async (data) => {
    // Проверяем уникальность OPT ID только если он изменился и не пуст
    if (data.opt_id && data.opt_id.trim() !== "" && data.opt_id !== originalUser.opt_id) {
        const { data: check, error } = await supabase
            .from('profiles')
            .select('id')
            .eq('opt_id', data.opt_id)
            .neq('id', originalUser.id) // Исключаем текущего пользователя из проверки
            .maybeSingle();
            
        if (error) {
            console.error("Ошибка при проверке уникальности opt_id", error);
            // В случае ошибки БД, позволяем пройти, чтобы сработал constraint на уровне БД
            return true;
        }
        // Если профиль с таким opt_id найден, он не уникален
        return !check;
    }
    return true;
}, {
    message: "Этот OPT ID уже используется другим пользователем",
    path: ["opt_id"],
});