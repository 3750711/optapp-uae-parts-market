
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface OptIdFieldProps {
  control: any;
  canEditOptId: boolean;
}

export const OptIdField: React.FC<OptIdFieldProps> = ({ control, canEditOptId }) => (
  <FormField
    control={control}
    name="optId"
    render={({ field }) => (
      <FormItem>
        <FormLabel>OPT ID</FormLabel>
        <FormControl>
          <Input
            placeholder="Введите ваш OPT ID"
            {...field}
            readOnly={!canEditOptId}
            className={!canEditOptId ? "bg-gray-100 cursor-not-allowed" : ""}
          />
        </FormControl>
        <FormMessage />
        {!canEditOptId && (
          <p className="text-sm text-muted-foreground mt-1">
            OPT ID можно изменить только владельцу профиля или администратору
          </p>
        )}
      </FormItem>
    )}
  />
);
