
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
  initialValue?: string;
}

export const TelegramField: React.FC<TelegramFieldProps> = ({ 
  control,
  telegram_edit_count = 0,
  disabled = false,
  description,
  placeholder = "@username",
  initialValue = ""
}) => {
  const isEditable = initialValue === "" && telegram_edit_count === 0;
  
  return (
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
              disabled={disabled || !isEditable}
              className={!isEditable ? "bg-gray-100 cursor-not-allowed" : ""}
            />
          </FormControl>
          {description ? (
            <FormDescription>{description}</FormDescription>
          ) : !isEditable && initialValue ? (
            <FormDescription className="text-yellow-600">
              Если вам нужно изменить telegram пожалуйста свяжитесь с администратором
            </FormDescription>
          ) : initialValue === "" ? (
            <FormDescription>
              У вас есть одна попытка указать Telegram ID
            </FormDescription>
          ) : (
            <FormDescription>
              Если вам нужно изменить telegram пожалуйста свяжитесь с администратором
            </FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
