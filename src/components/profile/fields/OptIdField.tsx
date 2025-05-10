
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface OptIdFieldProps {
  control: any;
  canEditOptId: boolean;
  optIdValue?: string;
}

export const OptIdField: React.FC<OptIdFieldProps> = ({ control, canEditOptId, optIdValue }) => {
  const isOptIdAlreadySet = optIdValue && optIdValue.trim() !== "";
  const isEditable = canEditOptId && !isOptIdAlreadySet;
  
  return (
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
              readOnly={!isEditable}
              className={!isEditable ? "bg-gray-100 cursor-not-allowed" : ""}
            />
          </FormControl>
          <FormMessage />
          {!canEditOptId && (
            <FormDescription className="text-sm text-muted-foreground mt-1">
              OPT ID можно изменить только владельцу профиля или администратору
            </FormDescription>
          )}
          {isOptIdAlreadySet && canEditOptId && (
            <FormDescription className="text-sm text-muted-foreground mt-1">
              Если вам нужно изменить OPT ID свяжитесь с администратором
            </FormDescription>
          )}
        </FormItem>
      )}
    />
  );
};
