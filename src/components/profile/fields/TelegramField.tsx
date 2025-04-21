
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface TelegramFieldProps {
  control: any;
}

export const TelegramField: React.FC<TelegramFieldProps> = ({ control }) => (
  <FormField
    control={control}
    name="telegram"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Telegram</FormLabel>
        <FormControl>
          <Input placeholder="@username" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
