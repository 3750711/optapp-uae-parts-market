
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { normalizeTelegramUsername, validateAndNormalizeTelegramUsername } from "@/utils/telegramNormalization";
import { getProfileTranslations } from "@/utils/profileTranslations";
import { useAuth } from "@/contexts/AuthContext";

interface TelegramFieldProps {
  control: any;
  telegram_edit_count?: number;
  disabled?: boolean;
  description?: string;
  placeholder?: string;
  initialValue?: string;
}

export const TelegramField: React.FC<TelegramFieldProps> = ({ 
  control,
  telegram_edit_count = 0,
  disabled = false,
  description,
  placeholder,
  initialValue = ""
}) => {
  const { isAdmin } = useAdminAccess();
  const { profile } = useAuth();
  const t = getProfileTranslations(profile?.user_type || 'buyer');
  
  // Admins can edit at any time, regular users can always edit now
  const isEditable = true;
  
  return (
    <FormField
      control={control}
      name="telegram"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Telegram</FormLabel>
          <FormControl>
            <Input 
              placeholder={placeholder || t.telegramPlaceholder}
              {...field} 
              disabled={disabled || !isEditable}
              className={!isEditable ? "bg-gray-100 cursor-not-allowed" : ""}
              onChange={(e) => {
                const normalized = normalizeTelegramUsername(e.target.value);
                field.onChange(normalized);
              }}
              onBlur={(e) => {
                const validation = validateAndNormalizeTelegramUsername(e.target.value);
                field.onChange(validation.normalized);
                field.onBlur();
              }}
            />
          </FormControl>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : (
            <FormDescription>
              {t.telegramDescription}
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
