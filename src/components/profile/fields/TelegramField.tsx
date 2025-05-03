
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

interface TelegramFieldProps {
  control: any;
  telegram_edit_count?: number;
  disabled?: boolean;
  description?: string;
  placeholder?: string;
}

export const TelegramField: React.FC<TelegramFieldProps> = ({ 
  control,
  telegram_edit_count = 0,
  disabled = false,
  description,
  placeholder = "@username"
}) => (
  <FormField
    control={control}
    name="telegram"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Telegram</FormLabel>
        <FormControl>
          <Input 
            placeholder={placeholder}
            {...field} 
            disabled={disabled || telegram_edit_count >= 1}
          />
        </FormControl>
        {description ? (
          <FormDescription>{description}</FormDescription>
        ) : telegram_edit_count >= 1 ? (
          <FormDescription className="text-yellow-600">
            Telegram ID можно изменить только один раз
          </FormDescription>
        ) : (
          <FormDescription>
            У вас есть одна попытка изменить Telegram ID
          </FormDescription>
        )}
        <FormMessage />
      </FormItem>
    )}
  />
);
